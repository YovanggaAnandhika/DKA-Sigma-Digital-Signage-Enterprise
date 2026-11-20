package com.dkaapis.sigma.presentation.renderers

import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder

sealed class YouTubeLiveTarget {
    data class Video(val videoId: String) : YouTubeLiveTarget()
    data class Channel(val channelId: String) : YouTubeLiveTarget()
}

object YouTubeLiveUrlParser {
    private val VIDEO_ID_REGEX = Regex("^[A-Za-z0-9_-]{11}$")
    private val CHANNEL_ID_REGEX = Regex("^UC[A-Za-z0-9_-]{10,}$")

    fun parse(rawUrl: String): YouTubeLiveTarget? {
        val trimmed = rawUrl.trim()
        if (trimmed.isEmpty()) return null

        val normalized = if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            trimmed
        } else {
            "https://$trimmed"
        }

        val uri = runCatching { URI(normalized) }.getOrNull() ?: return null
        val host = (uri.host ?: "").lowercase().removePrefix("www.").removePrefix("m.")
        val segments = (uri.path ?: "")
            .split('/')
            .filter { it.isNotEmpty() }

        if (host == "youtu.be") {
            val id = segments.firstOrNull().orEmpty()
            return if (VIDEO_ID_REGEX.matches(id)) YouTubeLiveTarget.Video(id) else null
        }

        if (host != "youtube.com" && host != "youtube-nocookie.com") {
            return null
        }

        if (segments.isEmpty()) return null

        if (segments[0] == "watch") {
            val v = queryParam(uri.rawQuery, "v").orEmpty()
            return if (VIDEO_ID_REGEX.matches(v)) YouTubeLiveTarget.Video(v) else null
        }

        if ((segments[0] == "live" || segments[0] == "embed") && segments.size >= 2) {
            val second = segments[1]
            if (second == "live_stream") {
                val ch = queryParam(uri.rawQuery, "channel").orEmpty()
                return if (CHANNEL_ID_REGEX.matches(ch)) YouTubeLiveTarget.Channel(ch) else null
            }
            if (VIDEO_ID_REGEX.matches(second)) {
                return YouTubeLiveTarget.Video(second)
            }
        }

        if (segments[0] == "channel" && segments.size >= 2) {
            val ch = segments[1]
            return if (CHANNEL_ID_REGEX.matches(ch)) YouTubeLiveTarget.Channel(ch) else null
        }

        return null
    }

    private fun queryParam(rawQuery: String?, key: String): String? {
        if (rawQuery.isNullOrBlank()) return null
        for (pair in rawQuery.split('&')) {
            val idx = pair.indexOf('=')
            val k = if (idx >= 0) pair.substring(0, idx) else pair
            if (URLDecoder.decode(k, "UTF-8") == key) {
                val v = if (idx >= 0) pair.substring(idx + 1) else ""
                return URLDecoder.decode(v, "UTF-8")
            }
        }
        return null
    }

    fun buildIframePlayerHtml(
        target: YouTubeLiveTarget,
        muted: Boolean,
        volumePercent: Int
    ): String {
        val safeVolume = volumePercent.coerceIn(0, 100)
        val embedSrc = when (target) {
            is YouTubeLiveTarget.Video ->
                "https://www.youtube.com/embed/${target.videoId}?enablejsapi=1&autoplay=1&mute=${if (muted) 1 else 0}&playsinline=1&controls=0&rel=0&modestbranding=1&origin=https://www.youtube.com"
            is YouTubeLiveTarget.Channel ->
                "https://www.youtube.com/embed/live_stream?channel=${URLEncoder.encode(target.channelId, "UTF-8")}&enablejsapi=1&autoplay=1&mute=${if (muted) 1 else 0}&playsinline=1&controls=0&rel=0&modestbranding=1&origin=https://www.youtube.com"
        }

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
              <style>
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
                iframe { width: 100%; height: 100%; border: 0; display: block; }
              </style>
            </head>
            <body>
              <iframe id="ytplayer"
                src="$embedSrc"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen>
              </iframe>
              <script src="https://www.youtube.com/iframe_api"></script>
              <script>
                var player = null;
                var desiredMuted = ${if (muted) "true" else "false"};
                var desiredVol = $safeVolume;
                function applyAudio() {
                  if (!player) return;
                  try {
                    if (desiredMuted) {
                      player.mute();
                    } else {
                      player.unMute();
                      player.setVolume(desiredVol);
                    }
                  } catch (e) {}
                }
                window.sigmaSetAudio = function(muted, vol) {
                  desiredMuted = !!muted;
                  desiredVol = Math.max(0, Math.min(100, vol || 0));
                  applyAudio();
                };
                function onYouTubeIframeAPIReady() {
                  player = new YT.Player('ytplayer', {
                    events: {
                      onReady: function(e) {
                        applyAudio();
                        try { e.target.playVideo(); } catch (err) {}
                      },
                      onStateChange: function(e) {
                        if (e.data === 1 && window.SigmaYtBridge) {
                          window.SigmaYtBridge.onPlaying();
                        }
                      },
                      onError: function(e) {
                        if (window.SigmaYtBridge) {
                          window.SigmaYtBridge.onError(e.data || -1);
                        }
                      }
                    }
                  });
                }
              </script>
            </body>
            </html>
        """.trimIndent()
    }
}
