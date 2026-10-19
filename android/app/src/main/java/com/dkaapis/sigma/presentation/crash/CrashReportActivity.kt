package com.dkaapis.sigma.presentation.crash

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.dkaapis.sigma.presentation.pairing.PairingActivity
import com.dkaapis.sigma.presentation.player.PlayerActivity

class CrashReportActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val errClass = intent.getStringExtra("error_class") ?: "UnknownException"
        val errMsg = intent.getStringExtra("error_message") ?: "Terjadi kesalahan tidak terduga"
        val errStack = intent.getStringExtra("error_stacktrace") ?: ""
        val errThread = intent.getStringExtra("error_thread") ?: "main"

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0f172a"))
            setPadding(48, 40, 48, 40)
        }

        val header = TextView(this).apply {
            text = "⚠️ DKASigma Signage — Diagnostik Crash"
            textSize = 24f
            setTextColor(Color.parseColor("#f87171"))
            setTypeface(null, Typeface.BOLD)
        }

        val subheader = TextView(this).apply {
            text = "Aplikasi terhenti pada thread [$errThread]. Informasi detail crash tercatat di bawah:"
            textSize = 13f
            setTextColor(Color.parseColor("#94a3b8"))
            setPadding(0, 8, 0, 16)
        }

        val errorTitle = TextView(this).apply {
            text = "$errClass: $errMsg"
            textSize = 15f
            setTextColor(Color.parseColor("#fca5a5"))
            setTypeface(Typeface.MONOSPACE, Typeface.BOLD)
            setBackgroundColor(Color.parseColor("#1e293b"))
            setPadding(20, 14, 20, 14)
        }

        val stackScrollView = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
            ).apply {
                setMargins(0, 16, 0, 20)
            }
            setBackgroundColor(Color.parseColor("#020617"))
            setPadding(20, 16, 20, 16)
        }

        val stackText = TextView(this).apply {
            text = errStack
            textSize = 12f
            setTextColor(Color.parseColor("#cbd5e1"))
            typeface = Typeface.MONOSPACE
            setTextIsSelectable(true)
        }
        stackScrollView.addView(stackText)

        val buttonRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END
        }

        val btnCopy = Button(this).apply {
            text = "Salin Log"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#334155"))
            setOnClickListener {
                val clip = ClipData.newPlainText("Crash Log", "$errClass: $errMsg\n\n$errStack")
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                clipboard?.setPrimaryClip(clip)
                Toast.makeText(this@CrashReportActivity, "Log crash disalin ke clipboard", Toast.LENGTH_SHORT).show()
            }
        }

        val btnPairing = Button(this).apply {
            text = "Buka Mode Pairing"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#0284c7"))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                marginStart = 16
            }
            setOnClickListener {
                val intent = Intent(this@CrashReportActivity, PairingActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                }
                startActivity(intent)
                finish()
            }
        }

        val btnRetry = Button(this).apply {
            text = "Buka Ulang Player"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#10b981"))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                marginStart = 16
            }
            setOnClickListener {
                val intent = Intent(this@CrashReportActivity, PlayerActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                }
                startActivity(intent)
                finish()
            }
        }

        buttonRow.addView(btnCopy)
        buttonRow.addView(btnPairing)
        buttonRow.addView(btnRetry)

        root.addView(header)
        root.addView(subheader)
        root.addView(errorTitle)
        root.addView(stackScrollView)
        root.addView(buttonRow)

        setContentView(root)
    }
}
