package si.ceyo.app.assistant;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaRecorder;
import android.media.audiofx.AcousticEchoCanceler;
import android.media.audiofx.NoiseSuppressor;
import android.os.Build;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;
import org.json.JSONObject;

/** One live Vapi conversation straight from the phone: microphone -> Vapi -> speaker, raw 16 kHz audio.
 *  Works without the app screen, so the power-button / wake-word assistant can talk over any app. */
public class CeyoLiveCall {
    public interface Listener { void onState(String state, String line); void onEnded(String reason); }

    private static final int RATE = 16000;
    private final Context ctx;
    private final Listener out;
    private volatile boolean live = true, assistantTalking;
    private volatile WebSocket socket;
    private volatile AudioRecord rec;
    private volatile AudioTrack track;
    private final LinkedBlockingQueue<byte[]> playback = new LinkedBlockingQueue<>();
    private int savedMode = AudioManager.MODE_NORMAL;
    private OkHttpClient http;

    public static String key(Context c) { return Routines.prefs(c).getString("voice_key", ""); }
    public static void saveKey(Context c, String k) {
        Routines.prefs(c).edit().putString("voice_key", k == null ? "" : k.replaceAll("[^A-Za-z0-9_-]", "")).commit();
    }

    public CeyoLiveCall(Context c, Listener l) { ctx = c.getApplicationContext(); out = l; }

    public void start() {
        out.onState("connecting", null);
        new Thread(this::connect, "ceyo-call-connect").start();
    }

    private void connect() {
        try {
            if (ctx.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) { finish("mic"); return; }
            HttpURLConnection c = (HttpURLConnection) new URL("https://" + MegsyBridge.TRUSTED_HOST + "/api/public/voice-call").openConnection();
            c.setRequestMethod("POST"); c.setConnectTimeout(10000); c.setReadTimeout(20000); c.setDoOutput(true);
            c.setRequestProperty("Authorization", "Bearer " + key(ctx));
            c.setRequestProperty("Content-Type", "application/json");
            try (OutputStream o = c.getOutputStream()) { o.write("{}".getBytes()); }
            int code = c.getResponseCode();
            String body = read(code < 400 ? c.getInputStream() : c.getErrorStream());
            if (code == 401) { saveKey(ctx, ""); finish("sign-in"); return; }
            if (code != 200) { finish("server"); return; }
            String url = new JSONObject(body).optString("url");
            if (!live) return;
            http = new OkHttpClient.Builder().readTimeout(0, TimeUnit.MILLISECONDS).pingInterval(15, TimeUnit.SECONDS).build();
            socket = http.newWebSocket(new Request.Builder().url(url).build(), new WebSocketListener() {
                @Override public void onOpen(WebSocket ws, Response r) { startAudio(); }
                @Override public void onMessage(WebSocket ws, ByteString bytes) { if (live) playback.offer(bytes.toByteArray()); }
                @Override public void onMessage(WebSocket ws, String text) { control(text); }
                @Override public void onClosed(WebSocket ws, int code, String reason) { finish("ended"); }
                @Override public void onFailure(WebSocket ws, Throwable t, Response r) { finish(live ? "network" : "ended"); }
            });
        } catch (Exception e) { finish("network"); }
    }

    private void control(String text) {
        try {
            JSONObject m = new JSONObject(text);
            String type = m.optString("type");
            if ("speech-update".equals(type) && "assistant".equals(m.optString("role"))) {
                assistantTalking = "started".equals(m.optString("status"));
                out.onState(assistantTalking ? "speaking" : "listening", null);
            } else if ("transcript".equals(type)) {
                String role = m.optString("role"), said = m.optString("transcript").trim();
                boolean fin = "final".equals(m.optString("transcriptType"));
                if ("user".equals(role) && assistantTalking && said.length() > 2) clearPlayback(); // barge-in
                if (fin && said.length() > 0) out.onState("user".equals(role) ? "thinking" : "speaking", ("user".equals(role) ? "إنت: " : "") + said);
            } else if ("user-interrupted".equals(type) || "clear".equals(type)) {
                clearPlayback();
            } else if ("status-update".equals(type) && "ended".equals(m.optString("status"))) {
                finish("ended");
            }
        } catch (Exception ignored) { }
    }

    private void clearPlayback() {
        playback.clear(); assistantTalking = false;
        AudioTrack t = track;
        if (t != null) try { t.pause(); t.flush(); t.play(); } catch (Exception ignored) { }
        out.onState("listening", null);
    }

    private void startAudio() {
        AudioManager am = ctx.getSystemService(AudioManager.class);
        savedMode = am.getMode();
        try { am.setMode(AudioManager.MODE_IN_COMMUNICATION); routeOutput(am); } catch (Exception ignored) { }
        int min = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        AudioRecord r = new AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(min, 3200) * 2);
        if (r.getState() != AudioRecord.STATE_INITIALIZED) { r.release(); finish("mic"); return; }
        if (AcousticEchoCanceler.isAvailable()) try { AcousticEchoCanceler.create(r.getAudioSessionId()).setEnabled(true); } catch (Exception ignored) { }
        if (NoiseSuppressor.isAvailable()) try { NoiseSuppressor.create(r.getAudioSessionId()).setEnabled(true); } catch (Exception ignored) { }
        int outMin = AudioTrack.getMinBufferSize(RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
        AudioTrack t = new AudioTrack.Builder()
            .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
            .setAudioFormat(new AudioFormat.Builder().setSampleRate(RATE).setEncoding(AudioFormat.ENCODING_PCM_16BIT).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
            .setTransferMode(AudioTrack.MODE_STREAM).setBufferSizeInBytes(Math.max(outMin * 4, 16000)).build();
        rec = r; track = t;
        r.startRecording(); t.play();
        out.onState("listening", null);
        new Thread(() -> {
            byte[] buf = new byte[640]; // 20 ms
            while (live) {
                AudioRecord a = rec; if (a == null) break;
                int n = a.read(buf, 0, buf.length);
                if (n < 0) { finish("mic"); break; }
                WebSocket ws = socket;
                if (n > 0 && ws != null) ws.send(ByteString.of(buf, 0, n));
            }
        }, "ceyo-call-mic").start();
        new Thread(() -> {
            while (live) {
                try {
                    byte[] chunk = playback.poll(200, TimeUnit.MILLISECONDS);
                    AudioTrack p = track;
                    if (chunk != null && p != null) p.write(chunk, 0, chunk.length);
                } catch (InterruptedException e) { break; } catch (Exception ignored) { }
            }
        }, "ceyo-call-speaker").start();
    }

    /** Headset or car if connected, otherwise the loudspeaker (never the quiet earpiece). */
    private static void routeOutput(AudioManager am) {
        if (Build.VERSION.SDK_INT >= 31) {
            AudioDeviceInfo speaker = null, headset = null;
            for (AudioDeviceInfo d : am.getAvailableCommunicationDevices()) {
                int t = d.getType();
                if (t == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) speaker = d;
                else if (t == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || t == AudioDeviceInfo.TYPE_WIRED_HEADSET || t == AudioDeviceInfo.TYPE_USB_HEADSET || t == 26 /* BLE_HEADSET */) headset = d;
            }
            AudioDeviceInfo pick = headset != null ? headset : speaker;
            if (pick != null) am.setCommunicationDevice(pick);
        } else {
            boolean headset = false;
            for (AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) {
                int t = d.getType();
                if (t == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || t == AudioDeviceInfo.TYPE_WIRED_HEADSET || t == AudioDeviceInfo.TYPE_WIRED_HEADPHONES) headset = true;
            }
            am.setSpeakerphoneOn(!headset);
        }
    }

    public void end() {
        WebSocket ws = socket;
        if (ws != null && live) try { ws.send("{\"type\":\"end-call\"}"); } catch (Exception ignored) { }
        finish("ended");
    }

    private synchronized void finish(String reason) {
        if (!live) return;
        live = false;
        AudioRecord r = rec; rec = null;
        if (r != null) try { r.stop(); r.release(); } catch (Exception ignored) { }
        AudioTrack t = track; track = null;
        if (t != null) try { t.stop(); t.release(); } catch (Exception ignored) { }
        playback.clear();
        WebSocket ws = socket; socket = null;
        if (ws != null) try { ws.close(1000, "done"); } catch (Exception ignored) { }
        AudioManager am = ctx.getSystemService(AudioManager.class);
        try {
            if (Build.VERSION.SDK_INT >= 31) am.clearCommunicationDevice(); else am.setSpeakerphoneOn(false);
            am.setMode(savedMode);
        } catch (Exception ignored) { }
        if (http != null) http.dispatcher().executorService().shutdown();
        out.onEnded(reason);
    }

    private static String read(InputStream in) throws java.io.IOException {
        if (in == null) return "";
        ByteArrayOutputStream o = new ByteArrayOutputStream(); byte[] b = new byte[4096]; int n;
        while ((n = in.read(b)) != -1) o.write(b, 0, n);
        return o.toString("UTF-8");
    }
}
