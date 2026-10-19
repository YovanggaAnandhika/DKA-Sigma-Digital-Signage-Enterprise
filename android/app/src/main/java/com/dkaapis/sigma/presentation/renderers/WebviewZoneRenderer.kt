package com.dkaapis.sigma.presentation.renderers

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.dkaapis.sigma.presentation.renderers.model.WebviewConfigPayload

class WebviewZoneRenderer(
    private val context: Context
) {
    @SuppressLint("SetJavaScriptEnabled")
    fun createView(parent: ViewGroup, payload: WebviewConfigPayload = WebviewConfigPayload()): WebView =
        WebView(context).apply {
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            webViewClient = WebViewClient()
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                loadWithOverviewMode = true
                useWideViewPort = true
            }
            setInitialScale(payload.zoomPercent)
            loadUrl(payload.url)
        }
}
