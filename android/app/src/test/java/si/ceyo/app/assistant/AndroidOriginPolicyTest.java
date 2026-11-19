package si.ceyo.app.assistant;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.junit.Test;

public class AndroidOriginPolicyTest {
    @Test public void shellAndNativeBridgeUseOnlyTheAndroidDomain() throws Exception {
        String config = new String(Files.readAllBytes(Paths.get("../../capacitor.config.ts")), StandardCharsets.UTF_8);
        String bridge = new String(Files.readAllBytes(Paths.get("src/main/java/si/ceyo/app/assistant/MegsyBridge.java")), StandardCharsets.UTF_8);
        assertTrue(config.contains("url: 'https://app.ceyo.si'"));
        assertTrue(bridge.contains("TRUSTED_HOST = \"app.ceyo.si\""));
        assertFalse(config.contains("lovable.app"));
        assertFalse(bridge.contains("lovable.app"));
    }
}
