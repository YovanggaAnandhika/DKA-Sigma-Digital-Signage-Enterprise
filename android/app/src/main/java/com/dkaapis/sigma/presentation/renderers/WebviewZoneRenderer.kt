package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

class WebviewZoneRenderer(
    private val context: Context
) {
    @SuppressLint("SetJavaScriptEnabled")
    fun createView(
        parent: ViewGroup,
        url: String,
        zoomPercent: Int = 100
    ): WebView {
        return WebView(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            webViewClient = WebViewClient()
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                loadWithOverviewMode = true
                useWideViewPort = true
            }
            setInitialScale(zoomPercent)
            loadUrl(url)
        }
    }
}
