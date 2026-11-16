# Règles ProGuard / R8 pour KLIN UP Pressing Pro

# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.klinup.app.**$$serializer { *; }
-keepclassmembers class com.klinup.app.** {
    *** Companion;
}
-keepclasseswithmembers class com.klinup.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Modèles de données KLIN UP
-keep class com.klinup.app.data.models.** { *; }
-keep class com.klinup.app.data.repository.** { *; }

# Ktor & Supabase
-dontwarn io.ktor.**
-dontwarn kotlinx.coroutines.**
-dontwarn org.slf4j.**
-keep class io.github.jan.supabase.** { *; }
