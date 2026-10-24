# Temporal Rift — release R8 rules (Capacitor WebView shell + Play mapping upload)

# Capacitor v3 plugins and annotations
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}

-keep public class * extends com.getcapacitor.Plugin { *; }

# Capacitor v2 plugins (deprecated but still supported)
-keep @com.getcapacitor.NativePlugin public class * {
    @com.getcapacitor.PluginMethod public <methods>;
}

# Cordova compatibility layer
-keep public class * extends org.apache.cordova.* {
    public <methods>;
    public <fields>;
}

# App entry + Capacitor bridge
-keep public class com.drpep.temporalrift.MainActivity { *; }
-keep public class * extends com.getcapacitor.BridgeActivity { *; }

# WebView JavaScript interfaces (if any plugins add them)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Readable stack traces + mapping.txt usefulness for Play Console
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
