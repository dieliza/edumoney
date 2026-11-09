package com.edumoney.qa.receiver;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.widget.TextView;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** Disposable emulator fixture. Reads only the explicitly shared URI, in memory. */
public final class ReceiverActivity extends Activity {
  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    String result;
    try {
      Uri uri = getIntent().getParcelableExtra(Intent.EXTRA_STREAM);
      if (uri == null) throw new IllegalStateException("Missing shared URI");
      ByteArrayOutputStream bytes = new ByteArrayOutputStream();
      try (InputStream stream = getContentResolver().openInputStream(uri)) {
        if (stream == null) throw new IllegalStateException("Unreadable shared URI");
        byte[] buffer = new byte[4096]; int count;
        while ((count = stream.read(buffer)) != -1) {
          bytes.write(buffer, 0, count);
          if (bytes.size() > 1048576) throw new IllegalStateException("Fixture limit exceeded");
        }
      }
      String text = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
      if ("text/csv".equals(getIntent().getType()) && text.startsWith("\"Empleado (código)\"")
          && text.contains("FICTICIO-MOVIL-01") && !text.contains("Empleado FICTICIO movil")) {
        result = "CSV local válido";
      } else if ("application/pdf".equals(getIntent().getType()) && text.startsWith("%PDF-")) {
        result = "PDF local válido";
      } else throw new IllegalStateException("Unexpected MIME or content");
    } catch (Exception error) { result = "ERROR QA: " + error.getClass().getSimpleName(); }
    TextView view = new TextView(this);
    view.setText(result + "\nSolo memoria. Sin red. Sin archivos guardados.");
    view.setTextSize(24); view.setPadding(24, 80, 24, 24); setContentView(view);
  }
}
