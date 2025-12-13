package com.yourcompany.weatherwidget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONObject
import java.net.URL
import android.graphics.BitmapFactory

/**
 * MINIMAL TEST WIDGET - Static text only
 */
class WeatherWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}

internal fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    try {
        val views = RemoteViews(context.packageName, R.layout.weather_widget)
        
        // Read data from SharedPreferences
        val sharedPref = context.getSharedPreferences("DATA", Context.MODE_PRIVATE)
        val appData = sharedPref.getString("appData", "{}")
        
        var city = "Loading..."
        var temp = "--"
        var imageUrl = ""
        var iconUrl = ""

        try {
            val jsonObject = JSONObject(appData)
            city = jsonObject.optString("city", "City")
            temp = jsonObject.optString("temp", "--")
            imageUrl = jsonObject.optString("imageUrl", "")
            iconUrl = jsonObject.optString("iconUrl", "")
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        views.setTextViewText(R.id.widget_city, city)
        views.setTextViewText(R.id.widget_temp, "$temp°")
        
        // Load Icon
        if (iconUrl.isNotEmpty()) {
             Thread {
                try {
                    val bmp = BitmapFactory.decodeStream(java.net.URL(iconUrl).openConnection().getInputStream())
                    if (bmp != null) {
                        views.setImageViewBitmap(R.id.widget_icon, bmp)
                        appWidgetManager.updateAppWidget(appWidgetId, views)
                    }
                } catch (e: Exception) { e.printStackTrace() }
            }.start()
        }

        // Load Background Image
        if (imageUrl.isNotEmpty()) {
            Thread {
                try {
                    val url = java.net.URL(imageUrl)
                    val connection = url.openConnection()
                    connection.connectTimeout = 40000
                    connection.readTimeout = 40000
                    val input = connection.getInputStream()
                    val bitmap = BitmapFactory.decodeStream(input)
                    
                    if (bitmap != null) {
                         // Widget updates must happen on the main thread or via AppWidgetManager
                         // Since we are in a background thread, we must push the update to the manager directly
                         views.setImageViewBitmap(R.id.widget_image, bitmap)
                         appWidgetManager.updateAppWidget(appWidgetId, views)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }.start()
        }
        
        // Initial update (text only) to ensure responsiveness
        appWidgetManager.updateAppWidget(appWidgetId, views)

    } catch (e: Exception) {
        e.printStackTrace()
    }
}
