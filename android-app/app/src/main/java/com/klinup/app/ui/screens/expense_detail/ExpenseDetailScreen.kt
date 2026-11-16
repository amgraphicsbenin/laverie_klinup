package com.klinup.app.ui.screens.expense_detail

import com.klinup.app.ui.components.TablerIcons

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.OpenInNew
import androidx.compose.material.icons.outlined.CloudUpload
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.PictureAsPdf
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.ExpenseCatalog
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.URL
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val BrandBlue = Color(0xFF0D2FE8)
private val CancelRed: Color @Composable get() = MaterialTheme.klinUpColors.redText
private val SuccessGreen: Color @Composable get() = MaterialTheme.klinUpColors.greenText
private val WarningAmber: Color @Composable get() = MaterialTheme.klinUpColors.amberText
private val BrandText: Color @Composable get() = MaterialTheme.klinUpColors.brandText
private val SurfaceBg: Color @Composable get() = MaterialTheme.klinUpColors.altPageBg
private val CardWhite: Color @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color @Composable get() = MaterialTheme.klinUpColors.border
private val InkPrimary: Color @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color @Composable get() = MaterialTheme.klinUpColors.inkMuted

@Composable
fun ExpenseDetailScreen(
    expenseId: String,
    onBack: () -> Unit
) {
    val expenses by KlinUpRepository.expenses.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()
    val expense = remember(expenses, expenseId) { expenses.firstOrNull { it.id == expenseId } }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current
    val appColors = MaterialTheme.klinUpColors

    var isUploading by remember { mutableStateOf(false) }
    var feedbackMessage by remember { mutableStateOf<String?>(null) }
    var isFeedbackError by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    val documentPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        isUploading = true
        feedbackMessage = null
        scope.launch {
            val res = KlinUpRepository.uploadExpenseReceipt(context, expenseId, uri)
            isUploading = false
            if (res.isSuccess) {
                isFeedbackError = false
                feedbackMessage = "Facture téléversée avec succès."
            } else {
                isFeedbackError = true
                feedbackMessage = res.exceptionOrNull()?.message ?: "Échec du téléversement de la facture."
            }
        }
    }

    if (expense == null) {
        Scaffold(containerColor = SurfaceBg) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Dépense introuvable",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkPrimary
                    )
                    Button(
                        onClick = onBack,
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                    ) {
                        Text("Retour", color = Color.White)
                    }
                }
            }
        }
        return
    }

    val storeName = remember(stores, expense.storeId) {
        stores.firstOrNull { it.id == expense.storeId || it.code == expense.storeId }?.nom
            ?: expense.storeId
    }

    val (statusLabel, statusColor, statusBg) = when (expense.status.lowercase()) {
        "en_attente" -> Triple("En attente", WarningAmber, WarningAmber.copy(alpha = 0.12f))
        "rejetee" -> Triple("Rejetée", CancelRed, CancelRed.copy(alpha = 0.12f))
        else -> Triple("Validée", SuccessGreen, SuccessGreen.copy(alpha = 0.12f))
    }

    val receiptUrl = expense.receiptUrl?.takeIf { it.isNotBlank() }
    val isPdf = remember(receiptUrl, expense.receiptMimeType, expense.receiptName) {
        val mime = expense.receiptMimeType.orEmpty().lowercase()
        val name = expense.receiptName.orEmpty().lowercase()
        val url = receiptUrl.orEmpty().lowercase()
        mime == "application/pdf" || name.endsWith(".pdf") || url.substringBefore('?').endsWith(".pdf")
    }

    var previewBitmap by remember(receiptUrl) { mutableStateOf<Bitmap?>(null) }
    var isLoadingPreview by remember(receiptUrl) { mutableStateOf(false) }

    LaunchedEffect(receiptUrl, isPdf) {
        if (receiptUrl != null && !isPdf) {
            isLoadingPreview = true
            previewBitmap = withContext(Dispatchers.IO) {
                runCatching {
                    URL(receiptUrl).openStream().use { BitmapFactory.decodeStream(it) }
                }.getOrNull()
            }
            isLoadingPreview = false
        } else {
            previewBitmap = null
            isLoadingPreview = false
        }
    }

    fun openReceiptExternally(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching {
            context.startActivity(intent)
        }.onFailure {
            isFeedbackError = true
            feedbackMessage = "Aucune application disponible pour ouvrir ce fichier."
        }
    }

    Scaffold(
        containerColor = SurfaceBg,
        topBar = {
            Surface(color = CardWhite, shadowElevation = 0.dp) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Surface(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onBack()
                        },
                        modifier = Modifier
                            .size(42.dp)
                            .align(Alignment.CenterStart),
                        shape = CircleShape,
                        color = appColors.chipBg
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = TablerIcons.ArrowLeft,
                                contentDescription = "Retour",
                                tint = InkPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Text(
                        text = "Détail de la dépense",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        modifier = Modifier.align(Alignment.Center)
                    )

                    Surface(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showDeleteDialog = true
                        },
                        modifier = Modifier
                            .size(42.dp)
                            .align(Alignment.CenterEnd),
                        shape = CircleShape,
                        color = CancelRed.copy(alpha = 0.10f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = TablerIcons.Trash,
                                contentDescription = "Supprimer la dépense",
                                tint = CancelRed,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .navigationBarsPadding()
                .padding(horizontal = 18.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (!feedbackMessage.isNullOrBlank()) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = if (isFeedbackError) CancelRed.copy(alpha = 0.10f) else SuccessGreen.copy(alpha = 0.10f),
                    border = BorderStroke(
                        1.dp,
                        if (isFeedbackError) CancelRed.copy(alpha = 0.35f) else SuccessGreen.copy(alpha = 0.35f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = feedbackMessage!!,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (isFeedbackError) CancelRed else SuccessGreen,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }

            // ── Hero Card ───────────────────────────────────────────────────
            Surface(
                shape = RoundedCornerShape(26.dp),
                color = CardWhite,
                border = BorderStroke(1.dp, CardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Surface(
                                color = appColors.softBlueBg,
                                border = BorderStroke(1.dp, BrandBlue.copy(alpha = 0.25f)),
                                shape = RoundedCornerShape(50)
                            ) {
                                Text(
                                    text = ExpenseCatalog.categoryLabel(expense.category),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandText,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                            Surface(
                                color = appColors.chipBg,
                                shape = RoundedCornerShape(50)
                            ) {
                                Text(
                                    text = if (expense.source == "admin") "Admin" else "App",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = InkSecondary,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Surface(
                            color = statusBg,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = statusLabel,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = statusColor,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Text(
                        text = expense.label,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary
                    )

                    Text(
                        text = "-${KlinUpRepository.formatFcfa(expense.amount)}",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = CancelRed
                    )

                    HorizontalDivider(color = CardBorder)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Date", fontSize = 11.sp, color = InkMuted)
                            Text(
                                text = expense.expenseDate.ifBlank { "Aujourd'hui" },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkPrimary
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Mode de paiement", fontSize = 11.sp, color = InkMuted)
                            Text(
                                text = ExpenseCatalog.paymentLabel(expense.paymentMethod),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkPrimary
                            )
                        }
                    }
                }
            }

            // ── Informations complémentaires ────────────────────────────────
            Surface(
                shape = RoundedCornerShape(26.dp),
                color = CardWhite,
                border = BorderStroke(1.dp, CardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.FileText,
                            contentDescription = null,
                            tint = BrandText,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Informations",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary
                        )
                    }

                    ExpenseInfoRow(label = "Magasin", value = storeName)
                    if (!expense.reference.isNullOrBlank()) {
                        ExpenseInfoRow(label = "Référence", value = expense.reference)
                    }
                    if (!expense.description.isNullOrBlank()) {
                        ExpenseInfoRow(label = "Description", value = expense.description)
                    }
                    if (!expense.createdByName.isNullOrBlank()) {
                        val roleSuffix = expense.createdByRole?.takeIf { it.isNotBlank() }?.let { " ($it)" }.orEmpty()
                        ExpenseInfoRow(label = "Enregistrée par", value = "${expense.createdByName}$roleSuffix")
                    }
                    if (!expense.createdAt.isNullOrBlank()) {
                        val formattedCreatedAt = KlinUpRepository.parseInstant(expense.createdAt)?.let {
                            DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm", Locale.FRENCH)
                                .withZone(ZoneId.systemDefault())
                                .format(it)
                        } ?: expense.createdAt
                        ExpenseInfoRow(
                            label = "Créée le",
                            value = formattedCreatedAt
                        )
                    }
                }
            }

            // ── Facture / Justificatif (Image ou PDF) ───────────────────────
            Surface(
                shape = RoundedCornerShape(26.dp),
                color = CardWhite,
                border = BorderStroke(1.dp, CardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.Receipt,
                                contentDescription = null,
                                tint = BrandText,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "Facture / Justificatif",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkPrimary
                            )
                        }

                        if (receiptUrl != null) {
                            Surface(
                                color = if (isPdf) CancelRed.copy(alpha = 0.10f) else appColors.softBlueBg,
                                shape = RoundedCornerShape(50)
                            ) {
                                Text(
                                    text = if (isPdf) "PDF" else "Image",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isPdf) CancelRed else BrandText,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }

                    if (receiptUrl != null) {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = appColors.chipBg,
                            border = BorderStroke(1.dp, CardBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = if (isPdf) CancelRed.copy(alpha = 0.12f) else appColors.softBlueBg,
                                        modifier = Modifier.size(40.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                imageVector = if (isPdf) TablerIcons.FileTypePdf else TablerIcons.Photo,
                                                contentDescription = null,
                                                tint = if (isPdf) CancelRed else BrandText,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                    }

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = expense.receiptName ?: "Facture jointe",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = InkPrimary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = if (isPdf) "Document PDF" else "Image justificative",
                                            fontSize = 11.sp,
                                            color = InkMuted
                                        )
                                    }

                                    IconButton(onClick = { openReceiptExternally(receiptUrl) }) {
                                        Icon(
                                            imageVector = TablerIcons.ExternalLink,
                                            contentDescription = "Ouvrir la facture",
                                            tint = BrandText
                                        )
                                    }
                                }

                                if (!isPdf) {
                                    when {
                                        isLoadingPreview -> {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(160.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                CircularProgressIndicator(
                                                    modifier = Modifier.size(26.dp),
                                                    strokeWidth = 2.dp,
                                                    color = BrandBlue
                                                )
                                            }
                                        }
                                        previewBitmap != null -> {
                                            Image(
                                                bitmap = previewBitmap!!.asImageBitmap(),
                                                contentDescription = "Aperçu de la facture",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(210.dp)
                                                    .clip(RoundedCornerShape(12.dp))
                                                    .clickable { openReceiptExternally(receiptUrl) }
                                            )
                                        }
                                    }
                                } else {
                                    OutlinedButton(
                                        onClick = { openReceiptExternally(receiptUrl) },
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, CardBorder),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(
                                            imageVector = TablerIcons.ExternalLink,
                                            contentDescription = null,
                                            tint = BrandText,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Ouvrir le PDF",
                                            color = BrandText,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        Text(
                            text = "Aucune facture téléversée pour cette dépense. Ajoutez une photo ou un document PDF.",
                            fontSize = 13.sp,
                            color = InkSecondary
                        )
                    }

                    Button(
                        onClick = {
                            if (!isUploading) {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                documentPickerLauncher.launch(arrayOf("image/*", "application/pdf"))
                            }
                        },
                        enabled = !isUploading,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                        contentPadding = PaddingValues(vertical = 13.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (isUploading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Téléversement en cours...",
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        } else {
                            Icon(
                                imageVector = TablerIcons.CloudUpload,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (receiptUrl == null) "Téléverser la facture" else "Remplacer la facture",
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Text(
                        text = "Formats supportés : Image (JPG, PNG, WEBP) et PDF (max 10 Mo)",
                        fontSize = 11.sp,
                        color = InkMuted
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }

    if (showDeleteDialog) {
        var isDeleting by remember(expense.id) { mutableStateOf(false) }
        var deleteReason by remember(expense.id) { mutableStateOf("") }
        var showReasonError by remember(expense.id) { mutableStateOf(false) }
        val isReasonValid = deleteReason.trim().isNotEmpty()
        AlertDialog(
            onDismissRequest = { if (!isDeleting) showDeleteDialog = false },
            containerColor = CardWhite,
            title = { Text("Supprimer la dépense ?", color = InkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Voulez-vous vraiment supprimer « ${expense.label} » (${KlinUpRepository.formatFcfa(expense.amount)}) ?",
                        color = InkSecondary
                    )
                    Text(
                        text = "Motif de la suppression *",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkPrimary
                    )
                    OutlinedTextField(
                        value = deleteReason,
                        onValueChange = {
                            deleteReason = it
                            if (showReasonError && it.trim().isNotEmpty()) showReasonError = false
                        },
                        placeholder = { Text("Ex : Erreur de saisie, doublon...", color = InkMuted) },
                        isError = showReasonError,
                        supportingText = {
                            Text(
                                text = if (showReasonError) "Le motif est obligatoire pour supprimer." else "Champ obligatoire",
                                color = if (showReasonError) CancelRed else InkMuted
                            )
                        },
                        singleLine = false,
                        minLines = 2,
                        maxLines = 4,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = InkPrimary,
                            unfocusedTextColor = InkPrimary,
                            focusedContainerColor = CardWhite,
                            unfocusedContainerColor = MaterialTheme.klinUpColors.chipBg,
                            focusedBorderColor = BrandBlue,
                            unfocusedBorderColor = Color(0xFF94A3B8),
                            errorBorderColor = CancelRed,
                            errorContainerColor = CancelRed.copy(alpha = 0.05f),
                            cursorColor = BrandBlue
                        )
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (isDeleting) return@TextButton
                        val trimmed = deleteReason.trim()
                        if (trimmed.isEmpty()) {
                            showReasonError = true
                            return@TextButton
                        }
                        isDeleting = true
                        scope.launch {
                            val res = KlinUpRepository.deleteExpense(expense.id, reason = trimmed)
                            isDeleting = false
                            showDeleteDialog = false
                            if (res.isSuccess) {
                                onBack()
                            } else {
                                isFeedbackError = true
                                feedbackMessage = res.exceptionOrNull()?.message ?: "Impossible de supprimer la dépense."
                            }
                        }
                    }
                ) {
                    Text(
                        "Supprimer",
                        color = if (isReasonValid) CancelRed else CancelRed.copy(alpha = 0.45f),
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { if (!isDeleting) showDeleteDialog = false }) {
                    Text("Annuler", color = InkSecondary)
                }
            }
        )
    }
}

@Composable
private fun ExpenseInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            color = InkMuted,
            modifier = Modifier.width(120.dp)
        )
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = InkPrimary,
            modifier = Modifier.weight(1f)
        )
    }
}
