package com.dkaapis.sigma

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import com.dkaapis.sigma.presentation.renderers.YouTubeLiveTarget
import com.dkaapis.sigma.presentation.renderers.YouTubeLiveUrlParser

class YouTubeLiveUrlParserTest {

    @Test
    fun parsesWatchLiveEmbedAndShortUrls() {
        assertEquals(
            YouTubeLiveTarget.Video("jfKfPfyJRdk"),
            YouTubeLiveUrlParser.parse("https://www.youtube.com/watch?v=jfKfPfyJRdk")
        )
        assertEquals(
            YouTubeLiveTarget.Video("jfKfPfyJRdk"),
            YouTubeLiveUrlParser.parse("https://www.youtube.com/live/jfKfPfyJRdk?feature=share")
        )
        assertEquals(
            YouTubeLiveTarget.Video("jfKfPfyJRdk"),
            YouTubeLiveUrlParser.parse("https://youtu.be/jfKfPfyJRdk")
        )
        assertEquals(
            YouTubeLiveTarget.Video("jfKfPfyJRdk"),
            YouTubeLiveUrlParser.parse("https://www.youtube.com/embed/jfKfPfyJRdk")
        )
    }

    @Test
    fun parsesChannelLiveAndEmbedLiveStreamUrls() {
        assertEquals(
            YouTubeLiveTarget.Channel("UCSJ4gkVC6NrvII8umztf0Ow"),
            YouTubeLiveUrlParser.parse("https://www.youtube.com/channel/UCSJ4gkVC6NrvII8umztf0Ow/live")
        )
        assertEquals(
            YouTubeLiveTarget.Channel("UCSJ4gkVC6NrvII8umztf0Ow"),
            YouTubeLiveUrlParser.parse("https://www.youtube.com/embed/live_stream?channel=UCSJ4gkVC6NrvII8umztf0Ow")
        )
    }

    @Test
    fun rejectsNonYoutubeOrInvalidUrls() {
        assertNull(YouTubeLiveUrlParser.parse(""))
        assertNull(YouTubeLiveUrlParser.parse("https://vimeo.com/123456"))
        assertNull(YouTubeLiveUrlParser.parse("https://www.youtube.com/watch?v=short"))
    }
}
