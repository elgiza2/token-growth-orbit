package si.ceyo.app.assistant;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.service.voice.VoiceInteractionService;

/** Ceyo as the phone's digital assistant. When chosen, it also turns on "Hey Ceyo" and
 *  opens the floating talk card (not the full app) when the wake word is heard. */
public class CeyoVoiceService extends VoiceInteractionService {
    public static final String ACTION_SHOW = "si.ceyo.app.SHOW_ASSISTANT";
    private BroadcastReceiver showRx;

    public static boolean active(Context c) {
        try { return VoiceInteractionService.isActiveService(c, new ComponentName(c, CeyoVoiceService.class)); } catch (Exception e) { return false; }
    }

    @Override public void onReady() {
        super.onReady();
        showRx = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) { Bundle b = new Bundle(); b.putString("from", "wake"); showSession(b, 0); }
        };
        IntentFilter f = new IntentFilter(ACTION_SHOW);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(showRx, f, Context.RECEIVER_NOT_EXPORTED); else registerReceiver(showRx, f);
        // Being the assistant means the user wants to call it by name; respect an explicit "off".
        SharedPreferences p = Routines.prefs(this);
        if (!p.contains("wake_on") && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) p.edit().putBoolean("wake_on", true).commit();
        try { CeyoWakeService.start(this); } catch (Exception ignored) { }
    }

    @Override public void onShutdown() {
        if (showRx != null) try { unregisterReceiver(showRx); } catch (Exception ignored) { }
        showRx = null;
        super.onShutdown();
    }
}
