package com.klinup.app

import android.app.Application
import com.klinup.app.data.local.NetworkMonitor
import com.klinup.app.data.repository.KlinUpRepository

class KlinUpApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        NetworkMonitor.init(applicationContext)
        KlinUpRepository.init(applicationContext)
    }
}
