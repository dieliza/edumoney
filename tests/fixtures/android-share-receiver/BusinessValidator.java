package com.edumoney.qa.receiver;

import org.json.JSONArray;
import org.json.JSONObject;

/** Exact expectations for the fictional commercial review flow; emulator only. */
final class BusinessValidator {
  private static void require(boolean value) {
    if (!value) throw new IllegalStateException("Commercial export mismatch");
  }
  static String validate(String mime, String text) throws Exception {
    if ("application/json".equals(mime)) {
      JSONObject report = new JSONObject(text);
      require("EduMoney-Negocio-CPA-v1".equals(report.getString("format")));
      require("Titular FICTICIO comercial".equals(report.getJSONObject("holder").getString("legalName")));
      require(report.isNull("projectId"));
      JSONObject totals = report.getJSONObject("totals");
      require(totals.getLong("expenseCents") == 5500 && totals.getLong("commercialExpenseCents") == 2750);
      require(totals.getLong("receivedCents") == 0 && totals.getLong("pendingExpenseCents") == 0);
      JSONArray rows = report.getJSONArray("rows");
      require(rows.length() == 2 && report.getJSONArray("projects").length() == 2);
      long amount = 0, commercial = 0, personal = 0;
      String movement = rows.getJSONObject(0).getString("movementId");
      String entry = rows.getJSONObject(0).getString("entryId");
      for (int i = 0; i < rows.length(); i++) {
        JSONObject row = rows.getJSONObject(i);
        require(movement.equals(row.getString("movementId")) && entry.equals(row.getString("entryId")));
        require(row.getBoolean("includedInTotals") && !row.getBoolean("stale"));
        require("mixed".equals(row.getString("useKind")) && row.getLong("percentBps") == 5000);
        require("changes".equals(row.getString("cpaStatus")));
        require("REVISION-FICTICIA-50".equals(row.getString("justification")));
        long value = row.getLong("amountCents");
        require(value == 3000 || value == 2500);
        amount += value; commercial += row.getLong("commercialCents"); personal += row.getLong("personalCents");
      }
      require(amount == 5500 && commercial == 2750 && personal == 2750);
      require(report.getJSONArray("pending").toString().contains("Requiere corrección"));
      require(report.getJSONArray("pending").toString().contains("comprobante pendiente"));
      require(report.getJSONArray("documents").length() == 0 && report.getJSONArray("copies").length() == 0);
      return "JSON comercial local válido: gasto 5500; comercial 2750; dos filas, un movimiento";
    }
    if ("text/csv".equals(mime)) {
      String clean = text.startsWith("\uFEFF") ? text.substring(1) : text;
      String[] lines = clean.split("\r\n");
      require(lines.length == 3 && lines[0].startsWith("\"entryId\",\"movementId\""));
      long amount = 0, commercial = 0, personal = 0;
      String movement = null;
      for (int i = 1; i < lines.length; i++) {
        // This scenario deliberately uses simple fixture values without commas/newlines.
        String[] cells = lines[i].split(",", -1);
        require(cells.length == 22);
        for (int k = 0; k < cells.length; k++) cells[k] = cells[k].substring(1, cells[k].length() - 1);
        require("mixed".equals(cells[7]) && "5000".equals(cells[15]));
        require("REVISION-FICTICIA-50".equals(cells[16]) && "changes".equals(cells[17]));
        if (movement == null) movement = cells[1]; else require(movement.equals(cells[1]));
        amount += Long.parseLong(cells[8]); commercial += Long.parseLong(cells[9]); personal += Long.parseLong(cells[10]);
      }
      require(amount == 5500 && commercial == 2750 && personal == 2750);
      return "CSV comercial local válido: gasto 5500; comercial 2750; dos filas, un movimiento";
    }
    throw new IllegalStateException("Unexpected commercial MIME");
  }
}
