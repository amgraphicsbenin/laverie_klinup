package com.klinup.laverie;

import android.content.Context;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Expose JavaScript interface for printing and saving PDF
        this.bridge.getWebView().post(new Runnable() {
            @Override
            public void run() {
                bridge.getWebView().addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void printReceipt(final String html) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                createWebPrintJob(html);
                            }
                        });
                    }

                    @JavascriptInterface
                    public void savePdf(final String base64Data, final String fileName) {
                        runOnUiThread(new Runnable() {
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
                                        
                                        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                                        if (uri != null) {
                                            os = getContentResolver().openOutputStream(uri);
                                            if (os != null) {
                                                os.write(pdfAsBytes);
                                                os.close();
                                                Toast.makeText(MainActivity.this, "Reçu enregistré dans les Téléchargements", Toast.LENGTH_LONG).show();
                                            }
                                        }
                                    } else {
                                        File downloadDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
                                        File file = new File(downloadDir, fileName);
                                        FileOutputStream fos = new FileOutputStream(file);
                                        fos.write(pdfAsBytes);
                                        fos.close();
                                        Toast.makeText(MainActivity.this, "Reçu enregistré : " + file.getAbsolutePath(), Toast.LENGTH_LONG).show();
                                    }
                                } catch (Exception e) {
                                    Toast.makeText(MainActivity.this, "Erreur de téléchargement : " + e.getMessage(), Toast.LENGTH_LONG).show();
                                    e.printStackTrace();
                                }
                            }
                        });
                    }
                }, "AndroidPrint");
            }
        });
    }

    private void createWebPrintJob(String html) {
        PrintManager printManager = (PrintManager) this.getSystemService(Context.PRINT_SERVICE);
        String jobName = "Facture Klin UP";
        
        WebView printWebView = new WebView(this);
        printWebView.loadDataWithBaseURL("file:///android_asset/public/", html, "text/html", "UTF-8", null);
        
        PrintDocumentAdapter printAdapter = printWebView.createPrintDocumentAdapter(jobName);

        if (printManager != null) {
            printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
        }
    }
}
