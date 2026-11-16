package com.klinup.app.ui.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.print.PrintAttributes
import android.print.PrintManager
import android.util.Base64
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.klinup.app.R
import com.klinup.app.data.models.Customer
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

private fun serviceLabel(code: String): String = when (code.lowercase()) {
    "lavage_simple" -> "Lavage Simple"
    "lavage_repassage" -> "Lavage & Repassage"
    "repassage_seul" -> "Repassage Seul"
    "nettoyage_sec" -> "Nettoyage à Sec"
    "abonnement" -> "Abonnement"
    else -> code.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

private fun paymentMethodLabel(code: String): String = when (code.lowercase()) {
    "especes" -> "Espèce"
    "mobile_money", "momo" -> "Mobile Money"
    "abonnement" -> "Abonnement"
    else -> code.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

private fun orderStatusLabel(status: String): String = when (status.lowercase()) {
    "en_attente" -> "En attente"
    "traitement", "en_cours_lavage" -> "En lavage"
    "en_cours_repassage" -> "En repassage"
    "pret" -> "Prêt"
    "en_cours_livraison" -> "En livraison"
    "restitue" -> "Livré/Retiré"
    "annule" -> "Annulée"
    else -> status.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

@Composable
private fun DashedLine(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(2.dp)
            .drawBehind {
                drawLine(
                    color = Color(0xFFCCCCCC),
                    start = Offset(0f, size.height / 2),
                    end = Offset(size.width, size.height / 2),
                    strokeWidth = 3f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f), 0f)
                )
            }
    )
}

@Composable
fun OrderInvoiceDialog(
    order: Order,
    customer: Customer?,
    storeName: String?,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val clientName = customer?.fullName?.takeIf { it.isNotBlank() } ?: "Client Passage"
    val clientPhone = customer?.telephone?.takeIf { it.isNotBlank() }
    val ticketCode = order.identifiantUniqueMarquage?.takeIf { it.isNotBlank() } ?: order.id
    val itemsList = remember(order) { order.items.orEmpty() }
    val itemsSum = remember(itemsList, order) {
        val raw = itemsList.sumOf { it.prix * it.quantite }
        if (raw > 0.0) raw else max(0.0, order.prixTotal - order.fraisLivraison)
    }
    val isExpress = order.niveauUrgence.equals("Express", ignoreCase = true)
    val netPrice = order.prixTotal
    val paidAmount = if (order.statut == "restitue" && order.avancePayee <= 0.0 && !order.isSubscriptionOrder) {
        netPrice
    } else {
        order.avancePayee
    }
    val remaining = if (order.isSubscriptionOrder) 0.0 else max(0.0, netPrice - paidAmount)

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 24.dp),
            shape = RoundedCornerShape(22.dp),
            color = Color(0xFFF1F5F9)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Barre d'action en haut
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Aperçu Facture",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF0F172A)
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                        Icon(
                            imageVector = TablerIcons.X,
                            contentDescription = "Fermer",
                            tint = Color(0xFF475569)
                        )
                    }
                }

                // Zone papier facture (fidèle au design Admin CMS)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 540.dp)
                        .verticalScroll(rememberScrollState())
                        .padding(14.dp)
                ) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // ── En-tête dynamique ──────────────────────
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo_brand),
                                    contentDescription = "Logo Laverie",
                                    contentScale = ContentScale.Fit,
                                    modifier = Modifier.height(52.dp)
                                )
                                Text(
                                    text = "Pressing Pro - Laverie & Pressing Premium",
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    text = if (!storeName.isNullOrBlank())
                                        "Facture Client • $storeName"
                                    else
                                        "Facture & Ticket de Dépôt Client",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF64748B),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color.Black
                                ) {
                                    Text(
                                        text = ticketCode,
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 15.sp,
                                        letterSpacing = 1.5.sp,
                                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                                    )
                                }
                            }

                            DashedLine()

                            // ── Détails commande ───────────────────────
                            val deliveryOrPickupDate = if (order.statut.equals("restitue", ignoreCase = true)) {
                                order.soldePaidAt ?: order.updatedAt ?: order.dueDate
                            } else {
                                order.dueDate
                            }
                            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                InvoiceMetaRow("Client :", if (clientPhone != null) "$clientName ($clientPhone)" else clientName)
                                InvoiceMetaRow("Statut :", orderStatusLabel(order.statut))
                                InvoiceMetaRow("Urgence :", order.niveauUrgence)
                                InvoiceMetaRow("Mode règlement :", paymentMethodLabel(order.modeReglement))
                                InvoiceMetaRow("Dépôt :", KlinUpRepository.formatOrderDate(order.createdAt))
                                InvoiceMetaRow("Date de livraison/Retrait :", KlinUpRepository.formatOrderDate(deliveryOrPickupDate))
                                if (!order.createdByName.isNullOrBlank()) {
                                    InvoiceMetaRow("Agent :", order.createdByName)
                                }
                            }

                            // ── Détail des articles ────────────────────
                            if (itemsList.isNotEmpty()) {
                                HorizontalDivider(color = Color(0xFFE5E5E5))
                                Text(
                                    text = "DÉTAIL DES ARTICLES",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF334155),
                                    letterSpacing = 0.8.sp
                                )
                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    itemsList.forEach { item ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "${item.quantite}x ${item.article}",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = Color(0xFF1E293B)
                                                )
                                                Text(
                                                    text = "${serviceLabel(item.service)} • ${KlinUpRepository.formatFcfa(item.prix)}/u",
                                                    fontSize = 10.sp,
                                                    color = Color(0xFF64748B)
                                                )
                                            }
                                            Text(
                                                text = KlinUpRepository.formatFcfa(item.prix * item.quantite),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF0F172A)
                                            )
                                        }
                                    }
                                }
                            }

                            // ── Bloc abonnement ────────────────────────
                            if (order.isSubscriptionOrder) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFF0FDF4),
                                    border = BorderStroke(1.dp, Color(0xFFBBF7D0)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(10.dp),
                                        verticalArrangement = Arrangement.spacedBy(3.dp)
                                    ) {
                                        Text(
                                            text = "Suivi Solde Abonnement",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = Color(0xFF16A34A)
                                        )
                                        order.subscriptionDetails?.planName?.let {
                                            Text("Forfait : $it", fontSize = 11.sp, color = Color(0xFF166534))
                                        }
                                        val used = order.subscriptionDetails?.usedClothes
                                            ?: order.subscriptionDetails?.vetementsUtilises
                                        if (used != null) {
                                            Text("Vêtements déduits : -$used", fontSize = 11.sp, color = Color(0xFF166534))
                                        }
                                    }
                                }
                            }

                            HorizontalDivider(color = Color(0xFFE5E5E5))

                            // ── Totaux ─────────────────────────────────
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                InvoiceAmountRow("Total Brut :", KlinUpRepository.formatFcfa(itemsSum), Color(0xFF555555), false)
                                if (isExpress) {
                                    InvoiceAmountRow("Majoration Express :", "Inclus", Color(0xFFD97706), true)
                                }
                                if (order.fraisLivraison > 0.0) {
                                    InvoiceAmountRow("Frais de livraison :", "+${KlinUpRepository.formatFcfa(order.fraisLivraison)}", Color(0xFF2563EB), true)
                                }

                                DashedLine()

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Net à payer :",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF1E293B)
                                    )
                                    Text(
                                        text = if (order.isSubscriptionOrder) "0 FCFA (Abonnement)" else KlinUpRepository.formatFcfa(netPrice),
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.Black
                                    )
                                }

                                if (!order.isSubscriptionOrder) {
                                    InvoiceAmountRow(
                                        "Acompte Payé :",
                                        KlinUpRepository.formatFcfa(paidAmount),
                                        Color(0xFF002CF7),
                                        true
                                    )
                                    HorizontalDivider(color = Color(0xFFE5E5E5))
                                    InvoiceAmountRow(
                                        "Reste à payer :",
                                        KlinUpRepository.formatFcfa(remaining),
                                        if (remaining > 0.0) Color(0xFFD32F2F) else Color(0xFF16A34A),
                                        true
                                    )
                                }
                            }

                            DashedLine()

                            // ── Pied de page ───────────────────────────
                            Text(
                                text = "Merci de votre confiance ! À bientôt chez Pressing Pro.",
                                fontSize = 11.sp,
                                color = Color(0xFF666666),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // Boutons bas de modale : Imprimer + Fermer
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Fermer", fontWeight = FontWeight.SemiBold, color = Color(0xFF334155))
                    }
                    Button(
                        onClick = { printOrderInvoice(context, order, customer, storeName) },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D2FE8)),
                        modifier = Modifier.weight(1.3f)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Printer,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Imprimer", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
private fun InvoiceMetaRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1A1A1A)
        )
        Text(
            text = value,
            fontSize = 12.sp,
            color = Color(0xFF334155)
        )
    }
}

@Composable
private fun InvoiceAmountRow(label: String, value: String, color: Color, bold: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
            color = color
        )
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = if (bold) FontWeight.ExtraBold else FontWeight.SemiBold,
            color = color
        )
    }
}

private fun escapeHtml(text: String): String = text
    .replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")
    .replace("\"", "&quot;")

fun printOrderInvoice(
    context: Context,
    order: Order,
    customer: Customer?,
    storeName: String?
) {
    val ticketCode = order.identifiantUniqueMarquage?.takeIf { it.isNotBlank() } ?: order.id
    val clientName = customer?.fullName?.takeIf { it.isNotBlank() } ?: "Client Passage"
    val clientPhone = customer?.telephone?.takeIf { it.isNotBlank() }
    val itemsList = order.items.orEmpty()
    val itemsSum = itemsList.sumOf { it.prix * it.quantite }
        .let { if (it > 0.0) it else max(0.0, order.prixTotal - order.fraisLivraison) }
    val netPrice = order.prixTotal
    val paidAmount = if (order.statut == "restitue" && order.avancePayee <= 0.0 && !order.isSubscriptionOrder) {
        netPrice
    } else {
        order.avancePayee
    }
    val remaining = if (order.isSubscriptionOrder) 0.0 else max(0.0, netPrice - paidAmount)

    val itemsHtml = if (itemsList.isEmpty()) "" else {
        val rows = itemsList.joinToString("") { item ->
            """
            <tr>
              <td style="padding:5px 0;border-bottom:1px solid #f1f5f9;">
                <div style="font-weight:600;color:#1e293b;">${item.quantite}x ${escapeHtml(item.article)}</div>
                <div style="font-size:10px;color:#64748b;">${escapeHtml(serviceLabel(item.service))} • ${item.prix.roundToInt()} FCFA/u</div>
              </td>
              <td style="padding:5px 0;text-align:right;font-weight:700;border-bottom:1px solid #f1f5f9;">
                ${(item.prix * item.quantite).roundToInt()} FCFA
              </td>
            </tr>
            """.trimIndent()
        }
        """
        <div style="margin:12px 0;border-top:1px solid #e5e5e5;padding-top:10px;">
          <div style="font-size:11px;font-weight:800;color:#334155;margin-bottom:6px;letter-spacing:0.6px;">DÉTAIL DES ARTICLES</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">$rows</table>
        </div>
        """.trimIndent()
    }

    val logoBase64 = runCatching {
        val bmp = BitmapFactory.decodeResource(context.resources, R.drawable.logo_brand)
        val out = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
        Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }.getOrNull()
    val logoHtml = if (logoBase64 != null) {
        """<img src="data:image/png;base64,$logoBase64" alt="Logo Laverie" style="height:54px;object-fit:contain;margin-bottom:6px;" />"""
    } else ""

    val html = """
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Facture_${escapeHtml(ticketCode)}</title>
            <style>
              @page { margin: 14mm 12mm; }
              * { box-sizing: border-box; }
              html, body { margin: 0; padding: 0; background: #ffffff; }
              body { padding: 12px 14px; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
              .header { text-align:center; padding-bottom:14px; margin-bottom:14px; border-bottom:2px dashed #cccccc; }
              .badge { display:inline-block; background:#000000; color:#ffffff; padding:6px 16px; border-radius:6px; font-weight:800; font-size:16px; letter-spacing:2px; margin-top:8px; }
              .meta { font-size:12px; line-height:1.65; padding-bottom:12px; border-bottom:1px solid #e5e5e5; }
              .row { display:flex; justify-content:space-between; margin:5px 0; font-size:13px; }
              .net { display:flex; justify-content:space-between; padding-top:8px; margin-top:8px; border-top:1px dashed #cccccc; font-weight:800; font-size:15px; }
              .footer { text-align:center; margin-top:16px; padding-top:12px; border-top:2px dashed #cccccc; font-size:11px; color:#666666; }
            </style>
          </head>
          <body>
            <div class="header">
              $logoHtml
              <h1 style="margin:0;font-size:19px;font-weight:700;color:#000;">Pressing Pro - Laverie &amp; Pressing Premium</h1>
              <p style="margin:4px 0 6px;font-size:11px;color:#64748b;font-weight:600;">
                ${if (!storeName.isNullOrBlank()) "Facture Client • ${escapeHtml(storeName)}" else "Facture &amp; Ticket de Dépôt Client"}
              </p>
              <div class="badge">${escapeHtml(ticketCode)}</div>
            </div>
            <div class="meta">
              <div><strong>Client :</strong> ${escapeHtml(if (clientPhone != null) "$clientName ($clientPhone)" else clientName)}</div>
              <div><strong>Statut :</strong> ${escapeHtml(orderStatusLabel(order.statut))}</div>
              <div><strong>Urgence :</strong> ${escapeHtml(order.niveauUrgence)}</div>
              <div><strong>Mode règlement :</strong> ${escapeHtml(paymentMethodLabel(order.modeReglement))}</div>
              <div><strong>Dépôt :</strong> ${escapeHtml(KlinUpRepository.formatOrderDate(order.createdAt))}</div>
              <div><strong>Date de livraison/Retrait :</strong> ${escapeHtml(KlinUpRepository.formatOrderDate(if (order.statut.equals("restitue", true)) (order.soldePaidAt ?: order.updatedAt ?: order.dueDate) else order.dueDate))}</div>
            </div>
            $itemsHtml
            <div style="margin-top:12px;">
              <div class="row"><span>Total Brut :</span><strong>${itemsSum.roundToInt()} FCFA</strong></div>
              ${if (order.niveauUrgence.equals("Express", true)) """<div class="row" style="color:#d97706;"><span>Majoration Express :</span><strong>Inclus</strong></div>""" else ""}
              ${if (order.fraisLivraison > 0.0) """<div class="row" style="color:#2563eb;"><span>Frais de livraison :</span><strong>+${order.fraisLivraison.roundToInt()} FCFA</strong></div>""" else ""}
              <div class="net"><span>Net à payer :</span><span>${if (order.isSubscriptionOrder) "0 FCFA (Abonnement)" else "${netPrice.roundToInt()} FCFA"}</span></div>
              ${if (!order.isSubscriptionOrder) """
                <div class="row" style="color:#002cf7;"><span>Acompte Payé :</span><strong>${paidAmount.roundToInt()} FCFA</strong></div>
                <div class="row" style="color:${if (remaining > 0.0) "#d32f2f" else "#16a34a"};border-top:1px solid #e5e5e5;padding-top:6px;">
                  <span>Reste à payer :</span><strong>${remaining.roundToInt()} FCFA</strong>
                </div>
              """ else ""}
            </div>
            <div class="footer">Merci de votre confiance ! À bientôt chez Pressing Pro.</div>
          </body>
        </html>
    """.trimIndent()

    val webView = WebView(context)
    webView.webViewClient = object : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = false
        override fun onPageFinished(view: WebView?, url: String?) {
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager ?: return
            val jobName = "Facture_$ticketCode"
            val printAdapter = webView.createPrintDocumentAdapter(jobName)
            printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
        }
    }
    webView.loadDataWithBaseURL(null, html, "text/HTML", "UTF-8", null)
}
