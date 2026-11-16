package com.klinup.app.data.remote

import com.klinup.app.BuildConfig
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.serializer.KotlinXSerializer
import kotlinx.serialization.json.Json

object SupabaseClientProvider {
    val SUPABASE_URL: String = BuildConfig.SUPABASE_URL
    val SUPABASE_KEY: String = BuildConfig.SUPABASE_KEY

    val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
        encodeDefaults = true
    }

    val client by lazy {
        createSupabaseClient(
            supabaseUrl = SUPABASE_URL,
            supabaseKey = SUPABASE_KEY
        ) {
            defaultSerializer = KotlinXSerializer(json)
            install(Postgrest)
            install(Realtime)
        }
    }
}
