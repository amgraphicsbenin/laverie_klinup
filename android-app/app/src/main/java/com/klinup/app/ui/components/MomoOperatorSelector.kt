package com.klinup.app.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.R
import com.klinup.app.ui.theme.klinUpColors

data class MomoOperatorOption(
    val id: String,
    val label: String,
    @DrawableRes val logoRes: Int,
    val accentColor: Color
)

object MomoOperators {
    val list = listOf(
        MomoOperatorOption("MTN", "MTN", R.drawable.logo_mtn, Color(0xFFFFCC00)),
        MomoOperatorOption("MOOV", "MOOV", R.drawable.logo_moov, Color(0xFF0057A8)),
        MomoOperatorOption("CELTIS", "CELTIS", R.drawable.logo_celtis, Color(0xFFE30613))
    )
}

@Composable
fun MomoOperatorSelector(
    selectedOperator: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.klinUpColors
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "Opérateur Mobile Money",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = colors.inkSecondary
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            MomoOperators.list.forEach { op ->
                val isSelected = selectedOperator.equals(op.id, ignoreCase = true)
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .clickable(role = Role.RadioButton) { onSelect(op.id) },
                    shape = RoundedCornerShape(14.dp),
                    color = if (isSelected) op.accentColor.copy(alpha = 0.14f) else colors.cardBg,
                    border = BorderStroke(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) op.accentColor else colors.border
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Image(
                            painter = painterResource(id = op.logoRes),
                            contentDescription = op.label,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(8.dp))
                        )
                        Text(
                            text = op.label,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.SemiBold,
                            color = if (isSelected) colors.inkPrimary else colors.inkSecondary
                        )
                    }
                }
            }
        }
    }
}
