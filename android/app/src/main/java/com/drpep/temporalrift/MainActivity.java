package com.drpep.temporalrift;

import android.view.InputDevice;
import android.view.KeyEvent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * v4.5.0 controller support. The game reads gamepads through the HTML5 Gamepad API
     * inside the Capacitor WebView (Chromium forwards pad key/motion events to it). If a
     * pad button still reaches the Activity unhandled, Android synthesizes a fallback key
     * (e.g. B -> BACK, A -> DPAD_CENTER) and BACK would close the game mid-run. Swallow
     * unhandled gamepad/joystick keys only; phone back gestures/buttons are unaffected.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (super.dispatchKeyEvent(event)) return true;
        return isGamepadKey(event);
    }

    private static boolean isGamepadKey(KeyEvent event) {
        int source = event.getSource();
        boolean padSource = (source & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
                || (source & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK;
        return padSource || KeyEvent.isGamepadButton(event.getKeyCode());
    }
}
