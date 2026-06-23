package com.klinup.laverie;

import android.content.Context;
import android.content.ContentValues;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "AndroidPrint")
public class AndroidPrintPlugin extends Plugin {

    @PluginMethod
    public void printReceipt(PluginCall call) {
        final String html = call.getString("html");
        if (html == null) {
            call.reject("HTML content is required");
            return;
        }

        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    createWebPrintJob(html);
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Print failed: " + e.getMessage());
                }
            }
        });
    }

    @PluginMethod
    public void savePdf(PluginCall call) {
        final String base64Data = call.getString("base64Data");
        final String fileName = call.getString("fileName");

        if (base64Data == null || fileName == null) {
            call.reject("base64Data and fileName are required");
            return;
        }

        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    byte[] pdfAsBytes = Base64.decode(base64Data, Base64.DEFAULT);
                    
                    OutputStream os;
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                        values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                        values.put(MediaStore.Downloads.RELATIVE_PATH, "Download/");
                        
                        Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (uri != null) {
                            os = getContext().getContentResolver().openOutputStream(uri);
                            if (os != null) {
                                os.write(pdfAsBytes);
                                os.close();
                                Toast.makeText(getContext(), "Reçu enregistré dans les Téléchargements", Toast.LENGTH_LONG).show();
                                JSObject ret = new JSObject();
                                ret.put("path", "Download/" + fileName);
                                call.resolve(ret);
                                return;
                            }
                        }
                        call.reject("Could not create content values or open output stream");
                    } else {
                        File downloadDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
                        File file = new File(downloadDir, fileName);
                        FileOutputStream fos = new FileOutputStream(file);
                        fos.write(pdfAsBytes);
                        fos.close();
                        Toast.makeText(getContext(), "Reçu enregistré : " + file.getAbsolutePath(), Toast.LENGTH_LONG).show();
                        JSObject ret = new JSObject();
                        ret.put("path", file.getAbsolutePath());
                        call.resolve(ret);
                    }
                } catch (Exception e) {
                    Toast.makeText(getContext(), "Erreur de téléchargement : " + e.getMessage(), Toast.LENGTH_LONG).show();
                    call.reject("Download failed: " + e.getMessage());
                }
            }
        });
    }

    private void createWebPrintJob(String html) {
        PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
        String jobName = "Facture Klin UP";
        
        WebView printWebView = new WebView(getContext());
        printWebView.loadDataWithBaseURL("file:///android_asset/public/", html, "text/html", "UTF-8", null);
        
        PrintDocumentAdapter printAdapter = printWebView.createPrintDocumentAdapter(jobName);

        if (printManager != null) {
            printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
        }
    }
}
