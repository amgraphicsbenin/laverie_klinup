package com.klinup.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import com.klinup.app.ui.theme.klinUpColors
import java.text.Normalizer

data class CountryDialCode(
    val iso: String,
    val flag: String,
    val name: String,
    val dialCode: String,
    val placeholder: String
) {
    val displayValue: String get() = "$flag +$dialCode"
}

object CountryDialCodes {
    val defaultCountry = CountryDialCode("BJ", "🇧🇯", "Bénin", "229", "Ex: 01 97 00 00 00")

    val all: List<CountryDialCode> = listOf(
        // ── Pays prioritaires (Afrique de l'Ouest, Centrale & diaspora) ──
        defaultCountry,
        CountryDialCode("TG", "🇹🇬", "Togo", "228", "Ex: 90 00 00 00"),
        CountryDialCode("CI", "🇨🇮", "Côte d'Ivoire", "225", "Ex: 07 00 00 00 00"),
        CountryDialCode("SN", "🇸🇳", "Sénégal", "221", "Ex: 77 000 00 00"),
        CountryDialCode("NG", "🇳🇬", "Nigeria", "234", "Ex: 0803 000 0000"),
        CountryDialCode("GH", "🇬🇭", "Ghana", "233", "Ex: 024 000 0000"),
        CountryDialCode("BF", "🇧🇫", "Burkina Faso", "226", "Ex: 70 00 00 00"),
        CountryDialCode("NE", "🇳🇪", "Niger", "227", "Ex: 90 00 00 00"),
        CountryDialCode("ML", "🇲🇱", "Mali", "223", "Ex: 70 00 00 00"),
        CountryDialCode("CM", "🇨🇲", "Cameroun", "237", "Ex: 6 70 00 00 00"),
        CountryDialCode("GA", "🇬🇦", "Gabon", "241", "Ex: 06 00 00 00"),
        CountryDialCode("CG", "🇨🇬", "Congo", "242", "Ex: 06 600 00 00"),
        CountryDialCode("CD", "🇨🇩", "RD Congo", "243", "Ex: 081 000 0000"),
        CountryDialCode("FR", "🇫🇷", "France", "33", "Ex: 06 12 34 56 78"),
        CountryDialCode("BE", "🇧🇪", "Belgique", "32", "Ex: 0470 12 34 56"),
        CountryDialCode("CH", "🇨🇭", "Suisse", "41", "Ex: 079 123 45 67"),
        CountryDialCode("CA", "🇨🇦", "Canada", "1", "Ex: (514) 555-0199"),
        CountryDialCode("US", "🇺🇸", "États-Unis", "1", "Ex: (555) 123-4567"),
        CountryDialCode("GB", "🇬🇧", "Royaume-Uni", "44", "Ex: 07700 900077"),

        // ── Reste du monde (ordre alphabétique) ──
        CountryDialCode("AF", "🇦🇫", "Afghanistan", "93", "Ex: 070 123 4567"),
        CountryDialCode("ZA", "🇿🇦", "Afrique du Sud", "27", "Ex: 071 123 4567"),
        CountryDialCode("AL", "🇦🇱", "Albanie", "355", "Ex: 067 123 4567"),
        CountryDialCode("DZ", "🇩🇿", "Algérie", "213", "Ex: 05 51 23 45 67"),
        CountryDialCode("DE", "🇩🇪", "Allemagne", "49", "Ex: 0151 23456789"),
        CountryDialCode("AD", "🇦🇩", "Andorre", "376", "Ex: 312 345"),
        CountryDialCode("AO", "🇦🇴", "Angola", "244", "Ex: 923 123 456"),
        CountryDialCode("AG", "🇦🇬", "Antigua-et-Barbuda", "1268", "Ex: 464-1234"),
        CountryDialCode("SA", "🇸🇦", "Arabie saoudite", "966", "Ex: 050 123 4567"),
        CountryDialCode("AR", "🇦🇷", "Argentine", "54", "Ex: 011 15-2345-6789"),
        CountryDialCode("AM", "🇦🇲", "Arménie", "374", "Ex: 077 123456"),
        CountryDialCode("AU", "🇦🇺", "Australie", "61", "Ex: 0412 345 678"),
        CountryDialCode("AT", "🇦🇹", "Autriche", "43", "Ex: 0664 123456"),
        CountryDialCode("AZ", "🇦🇿", "Azerbaïdjan", "994", "Ex: 050 123 45 67"),
        CountryDialCode("BS", "🇧🇸", "Bahamas", "1242", "Ex: 359-1234"),
        CountryDialCode("BH", "🇧🇭", "Bahreïn", "973", "Ex: 3600 1234"),
        CountryDialCode("BD", "🇧🇩", "Bangladesh", "880", "Ex: 01812-345678"),
        CountryDialCode("BB", "🇧🇧", "Barbade", "1246", "Ex: 250-1234"),
        CountryDialCode("BZ", "🇧🇿", "Belize", "501", "Ex: 622-1234"),
        CountryDialCode("BT", "🇧🇹", "Bhoutan", "975", "Ex: 17 12 34 56"),
        CountryDialCode("BY", "🇧🇾", "Biélorussie", "375", "Ex: 029 491-19-11"),
        CountryDialCode("BO", "🇧🇴", "Bolivie", "591", "Ex: 71234567"),
        CountryDialCode("BA", "🇧🇦", "Bosnie-Herzégovine", "387", "Ex: 061 123 456"),
        CountryDialCode("BW", "🇧🇼", "Botswana", "267", "Ex: 71 123 456"),
        CountryDialCode("BR", "🇧🇷", "Brésil", "55", "Ex: (11) 96123-4567"),
        CountryDialCode("BN", "🇧🇳", "Brunei", "673", "Ex: 712 3456"),
        CountryDialCode("BG", "🇧🇬", "Bulgarie", "359", "Ex: 088 123 4567"),
        CountryDialCode("BI", "🇧🇮", "Burundi", "257", "Ex: 79 56 12 34"),
        CountryDialCode("KH", "🇰🇭", "Cambodge", "855", "Ex: 091 234 567"),
        CountryDialCode("CV", "🇨🇻", "Cap-Vert", "238", "Ex: 991 12 34"),
        CountryDialCode("CL", "🇨🇱", "Chili", "56", "Ex: 9 6123 4567"),
        CountryDialCode("CN", "🇨🇳", "Chine", "86", "Ex: 131 2345 6789"),
        CountryDialCode("CY", "🇨🇾", "Chypre", "357", "Ex: 96 123456"),
        CountryDialCode("CO", "🇨🇴", "Colombie", "57", "Ex: 321 1234567"),
        CountryDialCode("KM", "🇰🇲", "Comores", "269", "Ex: 321 23 45"),
        CountryDialCode("KR", "🇰🇷", "Corée du Sud", "82", "Ex: 010-2000-0000"),
        CountryDialCode("CR", "🇨🇷", "Costa Rica", "506", "Ex: 8312 3456"),
        CountryDialCode("HR", "🇭🇷", "Croatie", "385", "Ex: 091 234 5678"),
        CountryDialCode("CU", "🇨🇺", "Cuba", "53", "Ex: 05 1234567"),
        CountryDialCode("DK", "🇩🇰", "Danemark", "45", "Ex: 32 12 34 56"),
        CountryDialCode("DJ", "🇩🇯", "Djibouti", "253", "Ex: 77 83 10 01"),
        CountryDialCode("DM", "🇩🇲", "Dominique", "1767", "Ex: 225-1234"),
        CountryDialCode("EG", "🇪🇬", "Égypte", "20", "Ex: 0100 123 4567"),
        CountryDialCode("AE", "🇦🇪", "Émirats arabes unis", "971", "Ex: 050 123 4567"),
        CountryDialCode("EC", "🇪🇨", "Équateur", "593", "Ex: 099 123 4567"),
        CountryDialCode("ER", "🇪🇷", "Érythrée", "291", "Ex: 07 123 456"),
        CountryDialCode("ES", "🇪🇸", "Espagne", "34", "Ex: 612 34 56 78"),
        CountryDialCode("EE", "🇪🇪", "Estonie", "372", "Ex: 5123 4567"),
        CountryDialCode("SZ", "🇸🇿", "Eswatini", "268", "Ex: 7612 3456"),
        CountryDialCode("ET", "🇪🇹", "Éthiopie", "251", "Ex: 091 123 4567"),
        CountryDialCode("FJ", "🇫🇯", "Fidji", "679", "Ex: 701 2345"),
        CountryDialCode("FI", "🇫🇮", "Finlande", "358", "Ex: 041 2345678"),
        CountryDialCode("GM", "🇬🇲", "Gambie", "220", "Ex: 301 2345"),
        CountryDialCode("GE", "🇬🇪", "Géorgie", "995", "Ex: 555 12 34 56"),
        CountryDialCode("GR", "🇬🇷", "Grèce", "30", "Ex: 691 234 5678"),
        CountryDialCode("GD", "🇬🇩", "Grenade", "1473", "Ex: 403-1234"),
        CountryDialCode("GP", "🇬🇵", "Guadeloupe", "590", "Ex: 0690 00 12 34"),
        CountryDialCode("GT", "🇬🇹", "Guatemala", "502", "Ex: 5123 4567"),
        CountryDialCode("GN", "🇬🇳", "Guinée", "224", "Ex: 601 12 34 56"),
        CountryDialCode("GQ", "🇬🇶", "Guinée équatoriale", "240", "Ex: 222 123 456"),
        CountryDialCode("GW", "🇬🇼", "Guinée-Bissau", "245", "Ex: 955 012 345"),
        CountryDialCode("GY", "🇬🇾", "Guyana", "592", "Ex: 609 1234"),
        CountryDialCode("GF", "🇬🇫", "Guyane française", "594", "Ex: 0694 20 12 34"),
        CountryDialCode("HT", "🇭🇹", "Haïti", "509", "Ex: 34 10 1234"),
        CountryDialCode("HN", "🇭🇳", "Honduras", "504", "Ex: 9123-4567"),
        CountryDialCode("HK", "🇭🇰", "Hong Kong", "852", "Ex: 5123 4567"),
        CountryDialCode("HU", "🇭🇺", "Hongrie", "36", "Ex: (20) 123 4567"),
        CountryDialCode("IN", "🇮🇳", "Inde", "91", "Ex: 081234 56789"),
        CountryDialCode("ID", "🇮🇩", "Indonésie", "62", "Ex: 0812-345-678"),
        CountryDialCode("IQ", "🇮🇶", "Irak", "964", "Ex: 0791 234 5678"),
        CountryDialCode("IR", "🇮🇷", "Iran", "98", "Ex: 0912 345 6789"),
        CountryDialCode("IE", "🇮🇪", "Irlande", "353", "Ex: 085 012 3456"),
        CountryDialCode("IS", "🇮🇸", "Islande", "354", "Ex: 611 1234"),
        CountryDialCode("IL", "🇮🇱", "Israël", "972", "Ex: 050-234-5678"),
        CountryDialCode("IT", "🇮🇹", "Italie", "39", "Ex: 312 345 6789"),
        CountryDialCode("JM", "🇯🇲", "Jamaïque", "1876", "Ex: 210-1234"),
        CountryDialCode("JP", "🇯🇵", "Japon", "81", "Ex: 090-1234-5678"),
        CountryDialCode("JO", "🇯🇴", "Jordanie", "962", "Ex: 07 9012 3456"),
        CountryDialCode("KZ", "🇰🇿", "Kazakhstan", "7", "Ex: 771 000 9998"),
        CountryDialCode("KE", "🇰🇪", "Kenya", "254", "Ex: 0712 123456"),
        CountryDialCode("KG", "🇰🇬", "Kirghizistan", "996", "Ex: 0700 123 456"),
        CountryDialCode("KW", "🇰🇼", "Koweït", "965", "Ex: 500 12345"),
        CountryDialCode("LA", "🇱🇦", "Laos", "856", "Ex: 020 23 123 456"),
        CountryDialCode("LS", "🇱🇸", "Lesotho", "266", "Ex: 5012 3456"),
        CountryDialCode("LV", "🇱🇻", "Lettonie", "371", "Ex: 21 234 567"),
        CountryDialCode("LB", "🇱🇧", "Liban", "961", "Ex: 71 123 456"),
        CountryDialCode("LR", "🇱🇷", "Liberia", "231", "Ex: 077 012 3456"),
        CountryDialCode("LY", "🇱🇾", "Libye", "218", "Ex: 091-2345678"),
        CountryDialCode("LI", "🇱🇮", "Liechtenstein", "423", "Ex: 660 234 567"),
        CountryDialCode("LT", "🇱🇹", "Lituanie", "370", "Ex: (8-612) 34567"),
        CountryDialCode("LU", "🇱🇺", "Luxembourg", "352", "Ex: 628 123 456"),
        CountryDialCode("MO", "🇲🇴", "Macao", "853", "Ex: 6612 3456"),
        CountryDialCode("MK", "🇲🇰", "Macédoine du Nord", "389", "Ex: 072 345 678"),
        CountryDialCode("MG", "🇲🇬", "Madagascar", "261", "Ex: 032 12 345 67"),
        CountryDialCode("MY", "🇲🇾", "Malaisie", "60", "Ex: 012-345 6789"),
        CountryDialCode("MW", "🇲🇼", "Malawi", "265", "Ex: 0991 23 45 67"),
        CountryDialCode("MV", "🇲🇻", "Maldives", "960", "Ex: 771-2345"),
        CountryDialCode("MT", "🇲🇹", "Malte", "356", "Ex: 9696 1234"),
        CountryDialCode("MA", "🇲🇦", "Maroc", "212", "Ex: 06 12 34 56 78"),
        CountryDialCode("MQ", "🇲🇶", "Martinique", "596", "Ex: 0696 20 12 34"),
        CountryDialCode("MU", "🇲🇺", "Maurice", "230", "Ex: 5251 2345"),
        CountryDialCode("MR", "🇲🇷", "Mauritanie", "222", "Ex: 22 12 34 56"),
        CountryDialCode("YT", "🇾🇹", "Mayotte", "262", "Ex: 0639 01 23 45"),
        CountryDialCode("MX", "🇲🇽", "Mexique", "52", "Ex: 222 123 4567"),
        CountryDialCode("MD", "🇲🇩", "Moldavie", "373", "Ex: 0621 12 345"),
        CountryDialCode("MC", "🇲🇨", "Monaco", "377", "Ex: 06 12 34 56 78"),
        CountryDialCode("MN", "🇲🇳", "Mongolie", "976", "Ex: 8812 3456"),
        CountryDialCode("ME", "🇲🇪", "Monténégro", "382", "Ex: 067 622 901"),
        CountryDialCode("MZ", "🇲🇿", "Mozambique", "258", "Ex: 82 123 4567"),
        CountryDialCode("MM", "🇲🇲", "Myanmar", "95", "Ex: 09 212 3456"),
        CountryDialCode("NA", "🇳🇦", "Namibie", "264", "Ex: 081 123 4567"),
        CountryDialCode("NP", "🇳🇵", "Népal", "977", "Ex: 984-1234567"),
        CountryDialCode("NI", "🇳🇮", "Nicaragua", "505", "Ex: 8123 4567"),
        CountryDialCode("NO", "🇳🇴", "Norvège", "47", "Ex: 406 12 345"),
        CountryDialCode("NC", "🇳🇨", "Nouvelle-Calédonie", "687", "Ex: 75.12.34"),
        CountryDialCode("NZ", "🇳🇿", "Nouvelle-Zélande", "64", "Ex: 021 123 4567"),
        CountryDialCode("OM", "🇴🇲", "Oman", "968", "Ex: 9212 3456"),
        CountryDialCode("UG", "🇺🇬", "Ouganda", "256", "Ex: 0712 345678"),
        CountryDialCode("UZ", "🇺🇿", "Ouzbékistan", "998", "Ex: 91 234 56 78"),
        CountryDialCode("PK", "🇵🇰", "Pakistan", "92", "Ex: 0301 2345678"),
        CountryDialCode("PS", "🇵🇸", "Palestine", "970", "Ex: 0599 123 456"),
        CountryDialCode("PA", "🇵🇦", "Panama", "507", "Ex: 6123-4567"),
        CountryDialCode("PG", "🇵🇬", "Papouasie-Nouvelle-Guinée", "675", "Ex: 7012 3456"),
        CountryDialCode("PY", "🇵🇾", "Paraguay", "595", "Ex: 0961 456789"),
        CountryDialCode("NL", "🇳🇱", "Pays-Bas", "31", "Ex: 06 12345678"),
        CountryDialCode("PE", "🇵🇪", "Pérou", "51", "Ex: 912 345 678"),
        CountryDialCode("PH", "🇵🇭", "Philippines", "63", "Ex: 0905 123 4567"),
        CountryDialCode("PL", "🇵🇱", "Pologne", "48", "Ex: 512 345 678"),
        CountryDialCode("PF", "🇵🇫", "Polynésie française", "689", "Ex: 87 12 34 56"),
        CountryDialCode("PR", "🇵🇷", "Porto Rico", "1787", "Ex: 234-5678"),
        CountryDialCode("PT", "🇵🇹", "Portugal", "351", "Ex: 912 345 678"),
        CountryDialCode("QA", "🇶🇦", "Qatar", "974", "Ex: 3312 3456"),
        CountryDialCode("CF", "🇨🇫", "République centrafricaine", "236", "Ex: 70 01 23 45"),
        CountryDialCode("DO", "🇩🇴", "République dominicaine", "1809", "Ex: 234-5678"),
        CountryDialCode("CZ", "🇨🇿", "République tchèque", "420", "Ex: 601 123 456"),
        CountryDialCode("RE", "🇷🇪", "La Réunion", "262", "Ex: 0692 12 34 56"),
        CountryDialCode("RO", "🇷🇴", "Roumanie", "40", "Ex: 0712 034 567"),
        CountryDialCode("RU", "🇷🇺", "Russie", "7", "Ex: 912 345-67-89"),
        CountryDialCode("RW", "🇷🇼", "Rwanda", "250", "Ex: 0720 123 456"),
        CountryDialCode("LC", "🇱🇨", "Sainte-Lucie", "1758", "Ex: 284-5678"),
        CountryDialCode("SV", "🇸🇻", "Salvador", "503", "Ex: 7012 3456"),
        CountryDialCode("WS", "🇼🇸", "Samoa", "685", "Ex: 72 23456"),
        CountryDialCode("ST", "🇸🇹", "Sao Tomé-et-Principe", "239", "Ex: 981 2345"),
        CountryDialCode("RS", "🇷🇸", "Serbie", "381", "Ex: 060 1234567"),
        CountryDialCode("SC", "🇸🇨", "Seychelles", "248", "Ex: 2 510 123"),
        CountryDialCode("SL", "🇸🇱", "Sierra Leone", "232", "Ex: (025) 123456"),
        CountryDialCode("SG", "🇸🇬", "Singapour", "65", "Ex: 8123 4567"),
        CountryDialCode("SK", "🇸🇰", "Slovaquie", "421", "Ex: 0912 123 456"),
        CountryDialCode("SI", "🇸🇮", "Slovénie", "386", "Ex: 031 234 567"),
        CountryDialCode("SO", "🇸🇴", "Somalie", "252", "Ex: 7 1123456"),
        CountryDialCode("SD", "🇸🇩", "Soudan", "249", "Ex: 091 123 1234"),
        CountryDialCode("SS", "🇸🇸", "Soudan du Sud", "211", "Ex: 0977 123 456"),
        CountryDialCode("LK", "🇱🇰", "Sri Lanka", "94", "Ex: 071 234 5678"),
        CountryDialCode("SE", "🇸🇪", "Suède", "46", "Ex: 070-123 45 67"),
        CountryDialCode("SR", "🇸🇷", "Suriname", "597", "Ex: 741-2345"),
        CountryDialCode("SY", "🇸🇾", "Syrie", "963", "Ex: 0944 567 890"),
        CountryDialCode("TJ", "🇹🇯", "Tadjikistan", "992", "Ex: 917 12 3456"),
        CountryDialCode("TW", "🇹🇼", "Taïwan", "886", "Ex: 0912 345 678"),
        CountryDialCode("TZ", "🇹🇿", "Tanzanie", "255", "Ex: 0621 234 567"),
        CountryDialCode("TD", "🇹🇩", "Tchad", "235", "Ex: 63 01 23 45"),
        CountryDialCode("TH", "🇹🇭", "Thaïlande", "66", "Ex: 081 234 5678"),
        CountryDialCode("TL", "🇹🇱", "Timor oriental", "670", "Ex: 7721 2345"),
        CountryDialCode("TT", "🇹🇹", "Trinité-et-Tobago", "1868", "Ex: 291-1234"),
        CountryDialCode("TN", "🇹🇳", "Tunisie", "216", "Ex: 20 123 456"),
        CountryDialCode("TM", "🇹🇲", "Turkménistan", "993", "Ex: 8 66 123456"),
        CountryDialCode("TR", "🇹🇷", "Turquie", "90", "Ex: 0501 234 56 78"),
        CountryDialCode("UA", "🇺🇦", "Ukraine", "380", "Ex: 050 123 4567"),
        CountryDialCode("UY", "🇺🇾", "Uruguay", "598", "Ex: 094 231 234"),
        CountryDialCode("VU", "🇻🇺", "Vanuatu", "678", "Ex: 591 2345"),
        CountryDialCode("VE", "🇻🇪", "Venezuela", "58", "Ex: 0412-1234567"),
        CountryDialCode("VN", "🇻🇳", "Viêt Nam", "84", "Ex: 091 234 56 78"),
        CountryDialCode("YE", "🇾🇪", "Yémen", "967", "Ex: 0712 345 678"),
        CountryDialCode("ZM", "🇿🇲", "Zambie", "260", "Ex: 095 5123456"),
        CountryDialCode("ZW", "🇿🇼", "Zimbabwe", "263", "Ex: 071 234 5678")
    )

    fun findByDisplayOrCode(raw: String?): CountryDialCode {
        if (raw.isNullOrBlank()) return defaultCountry
        val trimmed = raw.trim()
        all.firstOrNull { it.displayValue == trimmed }?.let { return it }
        val digits = trimmed.substringAfter("+", trimmed).filter { it.isDigit() }
        if (digits.isNotEmpty()) {
            all.firstOrNull { it.dialCode == digits }?.let { return it }
        }
        return defaultCountry
    }

    internal fun normalizeForSearch(text: String): String {
        val decomposed = Normalizer.normalize(text, Normalizer.Form.NFD)
        return decomposed.replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "").lowercase()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CountryCodePickerDialog(
    selectedCountry: CountryDialCode,
    onSelect: (CountryDialCode) -> Unit,
    onDismiss: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var query by remember { mutableStateOf("") }

    val filteredCountries = remember(query) {
        val clean = CountryDialCodes.normalizeForSearch(query.trim()).removePrefix("+")
        if (clean.isEmpty()) {
            CountryDialCodes.all
        } else {
            CountryDialCodes.all.filter { country ->
                CountryDialCodes.normalizeForSearch(country.name).contains(clean) ||
                    country.dialCode.contains(clean) ||
                    country.iso.lowercase().contains(clean)
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = colors.pageBg,
        contentColor = colors.inkPrimary,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp, bottom = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(4.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(colors.border)
                )
            }
        }
    ) {
        val view = LocalView.current
        SideEffect {
            val win = (view.parent as? DialogWindowProvider)?.window ?: return@SideEffect
            val controller = WindowCompat.getInsetsController(win, view)
            controller.isAppearanceLightStatusBars = !colors.isDark
            controller.isAppearanceLightNavigationBars = !colors.isDark
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(bottom = 24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Sélectionner un indicatif",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = colors.inkPrimary
                )
                IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = TablerIcons.X,
                        contentDescription = "Fermer",
                        tint = colors.inkSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = {
                    Text(
                        text = "Rechercher un pays ou +229...",
                        fontSize = 14.sp,
                        color = colors.placeholder
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = TablerIcons.Search,
                        contentDescription = null,
                        tint = colors.inkMuted,
                        modifier = Modifier.size(18.dp)
                    )
                },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        IconButton(onClick = { query = "" }, modifier = Modifier.size(28.dp)) {
                            Icon(
                                imageVector = TablerIcons.X,
                                contentDescription = "Effacer",
                                tint = colors.inkMuted,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = colors.innerBorder,
                    focusedBorderColor = colors.brandBlue,
                    unfocusedContainerColor = colors.cardBg,
                    focusedContainerColor = colors.cardBg,
                    unfocusedTextColor = colors.inkPrimary,
                    focusedTextColor = colors.inkPrimary
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (filteredCountries.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Aucun pays trouvé pour « $query »",
                        fontSize = 13.5.sp,
                        color = colors.inkMuted
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    contentPadding = PaddingValues(bottom = 8.dp)
                ) {
                    items(filteredCountries, key = { "${it.iso}_${it.dialCode}" }) { country ->
                        val isSelected = country.iso == selectedCountry.iso && country.dialCode == selectedCountry.dialCode
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = if (isSelected) colors.softBlueBg else colors.cardBg,
                            border = BorderStroke(
                                width = 1.dp,
                                color = if (isSelected) colors.softBlueBorder else colors.border
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .clickable { onSelect(country) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    text = country.flag,
                                    fontSize = 20.sp
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = country.name,
                                        fontSize = 14.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                                        color = if (isSelected) colors.brandText else colors.inkPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = country.placeholder,
                                        fontSize = 11.5.sp,
                                        color = colors.inkMuted,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Text(
                                    text = "+${country.dialCode}",
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) colors.brandText else colors.inkSecondary
                                )
                                if (isSelected) {
                                    Icon(
                                        imageVector = TablerIcons.CircleCheck,
                                        contentDescription = "Sélectionné",
                                        tint = colors.brandText,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
