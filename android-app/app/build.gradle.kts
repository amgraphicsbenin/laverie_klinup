import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    id("com.google.gms.google-services")
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

        buildConfigField("String", "APP_ENV", "\"$appEnv\"")
        buildConfigField("String", "SUPABASE_URL", "\"https://ryjwrjzggfwglfmyovhk.supabase.co\"")
        buildConfigField("String", "SUPABASE_KEY", "\"sb_publishable_ZVFeOSNGPhFp1ZOGcV0aWQ_f7466uj9\"")
    }

    signingConfigs {
        val sharedTestKeystore = file("klinup-debug.keystore")
        val localKeystorePropsFile = rootProject.file("keystore.properties")
        val localKeystoreProps = Properties().apply {
            if (localKeystorePropsFile.exists()) {
                localKeystorePropsFile.inputStream().use { load(it) }
            }
        }

        getByName("debug") {
            if (sharedTestKeystore.exists()) {
                storeFile = sharedTestKeystore
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
        create("release") {
            val envKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
                ?: localKeystoreProps.getProperty("storeFile")
            val envKeystore = envKeystorePath?.let { path ->
                val direct = file(path)
                if (direct.exists()) direct else rootProject.file(path)
            }?.takeIf { it.exists() }

            if (envKeystore != null) {
                storeFile = envKeystore
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                    ?: localKeystoreProps.getProperty("storePassword")
                    ?: ""
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                    ?: localKeystoreProps.getProperty("keyAlias")
                    ?: ""
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
                    ?: localKeystoreProps.getProperty("keyPassword")
                    ?: ""
            } else {
                // Fallback si aucun keystore release n'est configuré (env vars ou keystore.properties)
                storeFile = sharedTestKeystore
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
            // Schémas de signature modernes Android (v1 + v2 + v3 + v4) pour intégrité maximale
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
            enableV4Signing = true
        }
    }

    buildTypes {
        release {
            isDebuggable = false
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
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
    implementation(libs.play.services.location)

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
