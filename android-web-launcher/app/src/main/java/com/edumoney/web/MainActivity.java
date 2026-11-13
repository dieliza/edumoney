package com.edumoney.web;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** Opens the real browser so authentication, encrypted storage and camera remain
 * under the browser's origin and permissions. No embedded WebView or JS bridge. */
public final class MainActivity extends Activity {
    public static final String APP_URL = "https://edumoney-web.diegoluissantospabon.chatgpt.site";
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding * 2, padding, padding * 2);
        TextView title = new TextView(this);
        title.setText("EduMoney Web"); title.setTextSize(28);
        layout.addView(title);
        TextView help = new TextView(this);
        help.setText("Abre EduMoney en tu navegador habitual. Las mejoras publicadas de la web se reciben al abrir o recargar, sin reinstalar esta APK.\n\nLos datos de la APK anterior no se trasladan automáticamente. Conserva esa app y utiliza un respaldo para transferirlos. Usa siempre el mismo navegador para conservar tu espacio local.\n\nLa web privada solicita acceso con tu cuenta de ChatGPT. La sincronización cifrada se activa por separado dentro de EduMoney.");
        help.setTextSize(17); help.setPadding(0, padding, 0, padding);
        layout.addView(help);
        Button open = new Button(this); open.setText("Abrir EduMoney");
        open.setOnClickListener(v -> openWeb()); layout.addView(open);
        setContentView(layout);
        if (savedInstanceState == null) openWeb();
    }
    private void openWeb() {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(APP_URL))); }
        catch (ActivityNotFoundException error) {
            Toast.makeText(this, "Instala o habilita un navegador para abrir EduMoney.", Toast.LENGTH_LONG).show();
        }
    }
}
