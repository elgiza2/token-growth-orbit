package si.ceyo.app.assistant;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.service.voice.VoiceInteractionSession;
import android.service.voice.VoiceInteractionSessionService;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Power/home long-press or "Hey Ceyo": a small floating card over whatever is on screen,
 *  with a live two-way voice conversation. The full app opens only if the user taps it. */
public class CeyoVoiceSessionService extends VoiceInteractionSessionService {
    @Override public VoiceInteractionSession onNewSession(Bundle args) { return new Session(this); }

    static final class Session extends VoiceInteractionSession {
        private final Handler ui = new Handler(Looper.getMainLooper());
        private ImageView robot; private TextView status, line; private Button main;
        private CeyoLiveCall call;

        Session(Context c) { super(c); }

        private int dp(int v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getContext().getResources().getDisplayMetrics()); }

        @Override public View onCreateContentView() {
            Context c = getContext();
            FrameLayout root = new FrameLayout(c);
            root.setOnClickListener(v -> hide()); // tap outside closes
            LinearLayout card = new LinearLayout(c);
            card.setOrientation(LinearLayout.VERTICAL); card.setGravity(Gravity.CENTER_HORIZONTAL);
            card.setPadding(dp(20), dp(18), dp(20), dp(16)); card.setClickable(true);
            GradientDrawable bg = new GradientDrawable(); bg.setColor(Color.parseColor("#F2141619")); bg.setCornerRadius(dp(28));
            card.setBackground(bg); card.setElevation(dp(12));
            robot = new ImageView(c); robot.setImageBitmap(CeyoRobot.bitmap(c, "idle", 160));
            card.addView(robot, new LinearLayout.LayoutParams(dp(72), dp(72)));
            TextView name = text(c, CeyoRobot.name(c), 18, Color.WHITE); card.addView(name);
            status = text(c, "", 14, Color.parseColor("#B8C0CC")); card.addView(status);
            line = text(c, "", 15, Color.WHITE); line.setMaxLines(4); line.setPadding(0, dp(8), 0, dp(4)); card.addView(line);
            LinearLayout row = new LinearLayout(c); row.setGravity(Gravity.CENTER); row.setPadding(0, dp(10), 0, 0);
            main = new Button(c); main.setAllCaps(false); main.setText("إنهاء"); main.setOnClickListener(v -> hide());
            Button open = new Button(c); open.setAllCaps(false); open.setText("افتح Ceyo");
            open.setOnClickListener(v -> { startAssistantActivity(CeyoIntents.openIntent(getContext(), "/")); hide(); });
            row.addView(main); row.addView(open);
            card.addView(row);
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
            lp.setMargins(dp(12), 0, dp(12), dp(24));
            root.addView(card, lp);
            return root;
        }

        private static TextView text(Context c, String s, int sp, int color) {
            TextView t = new TextView(c); t.setText(s); t.setTextSize(sp); t.setTextColor(color); t.setGravity(Gravity.CENTER); return t;
        }

        @Override public void onShow(Bundle args, int flags) {
            super.onShow(args, flags);
            Window w = getWindow().getWindow();
            if (w != null) { w.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT)); w.setDimAmount(0.25f); }
            Context c = getContext();
            if (c.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) { problem("اسمح لـ Ceyo بالمايك من التطبيق الأول."); return; }
            if (CeyoLiveCall.key(c).isEmpty()) { problem("افتح Ceyo مرة وانت مسجّل دخول، وبعدها أقدر أكلمك من هنا."); return; }
            show("connecting", "بيوصل…", null);
            // Free the microphone from the wake-word listener before the conversation takes it.
            CeyoWakeService.stop(c);
            ui.postDelayed(this::begin, 450);
        }

        private void begin() {
            if (call != null || !isShowing()) return;
            call = new CeyoLiveCall(getContext(), new CeyoLiveCall.Listener() {
                @Override public void onState(String state, String said) { ui.post(() -> show(state, label(state), said)); }
                @Override public void onEnded(String reason) {
                    ui.post(() -> {
                        call = null;
                        if ("ended".equals(reason)) { hide(); return; }
                        problem(reason(reason));
                    });
                }
            });
            call.start();
        }

        private boolean isShowing() { try { return getWindow() != null && getWindow().isShowing(); } catch (Exception e) { return false; } }

        private static String label(String state) {
            switch (state) {
                case "listening": return "سامعك… اتكلم";
                case "thinking": return "بفكّر…";
                case "speaking": return "بيرد — قاطعه في أي وقت";
                default: return "بيوصل…";
            }
        }
        private static String reason(String r) {
            switch (r) {
                case "sign-in": return "محتاج تفتح Ceyo وتسجّل دخول مرة تانية.";
                case "mic": return "المايك مش متاح دلوقتي (ممكن تطبيق تاني ماسكه).";
                case "server": return "خدمة الصوت مش متاحة دلوقتي، جرّب كمان شوية.";
                default: return "مفيش اتصال بالنت، جرّب تاني.";
            }
        }

        private void show(String state, String label, String said) {
            if (status == null) return;
            status.setText(label);
            if (said != null) line.setText(said);
            robot.setImageBitmap(CeyoRobot.bitmap(getContext(), "speaking".equals(state) ? "talking" : "thinking".equals(state) ? "thinking" : "idle", 160));
        }
        private void problem(String msg) {
            if (status == null) return;
            status.setText(msg); main.setText("إغلاق");
        }

        @Override public void onHide() {
            CeyoLiveCall c = call; call = null;
            if (c != null) c.end();
            ui.removeCallbacksAndMessages(null);
            ui.postDelayed(() -> CeyoWakeService.start(getContext()), 800);
            super.onHide();
        }
    }
}
