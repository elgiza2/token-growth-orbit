package si.ceyo.app.assistant;

import static org.junit.Assert.assertFalse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.junit.Test;

public class FullScreenIntentPolicyTest {
    @Test public void fullScreenIntentPermissionAndLaunchersAreRemoved() throws Exception {
        String manifest = new String(Files.readAllBytes(Paths.get("src/main/AndroidManifest.xml")), StandardCharsets.UTF_8);
        String receiver = new String(Files.readAllBytes(Paths.get("src/main/java/si/ceyo/app/assistant/CeyoAlarmReceiver.java")), StandardCharsets.UTF_8);
        assertFalse(manifest.contains("android.permission.USE_FULL_SCREEN_INTENT"));
        assertFalse(receiver.contains(".setFullScreenIntent("));
    }
}
