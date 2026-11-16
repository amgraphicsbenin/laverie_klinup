plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.klinup.app"
    compileSdk = 35

    defaultConfig {
        val appEnv = (System.getenv("APP_ENV") ?: findProperty("APP_ENV")?.toString() ?: "test").lowercase()
        val resolvedAppId = when (appEnv) {
            "production", "prod" -> "com.klinup.laverie"
            "staging", "beta" -> "com.klinup.laverie.beta"
            else -> "com.klinup.laverie.test"
        }
        val resolvedAppName = when (appEnv) {
            "production", "prod" -> "Pressing Pro"
            "staging", "beta" -> "Pressing Pro (Bêta)"
            else -> "Pressing Pro (Test)"
        }
        val ciBuildNumber = System.getenv("BUILD_NUMBER")?.toIntOrNull() ?: 1

        applicationId = resolvedAppId
        minSdk = 26
        targetSdk = 35
        versionCode = ciBuildNumber
        versionName = "1.0.0"

        resValue("string", "app_name", resolvedAppName)

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "SUPABASE_URL", "\"https://ryjwrjzggfwglfmyovhk.supabase.co\"")
        buildConfigField("String", "SUPABASE_KEY", "\"sb_publishable_ZVFeOSNGPhFp1ZOGcV0aWQ_f7466uj9\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Build optimisé (non-debuggable) signé avec la clé de debug pour les tests locaux sur appareil
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("androidx.biometric:biometric:1.1.0")

    // Ktor & Supabase Kotlin SDK
    implementation(libs.ktor.client.android)
    implementation(libs.ktor.client.cio)
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.realtime)
    implementation(libs.supabase.auth)
    implementation(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
