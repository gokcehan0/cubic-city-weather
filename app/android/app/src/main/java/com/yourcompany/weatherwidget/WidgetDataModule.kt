package com.yourcompany.weatherwidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.graphics.BitmapFactory
import android.widget.RemoteViews
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.net.URL
import java.util.concurrent.Executors

class WidgetDataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context: Context = reactContext

    override fun getName(): String {
        return "WidgetDataModule"
    }

    @ReactMethod
    fun updateWidgetData(dataJson: String) {
        // 1. Save data to SharedPreferences
        val sharedPref = context.getSharedPreferences("DATA", Context.MODE_PRIVATE)
        val editor = sharedPref.edit()
        editor.putString("appData", dataJson)
        editor.apply()

        // 2. Parse Data
        var city = "Loading..."
        var temp = "--"
        var imageUrl = ""
        try {
            val jsonObject = JSONObject(dataJson)
            city = jsonObject.optString("city", "City")
            temp = jsonObject.optString("temp", "--")
            imageUrl = jsonObject.optString("imageUrl", "")
            val iconUrl = jsonObject.optString("iconUrl", "")
        } catch (e: Exception) {
            e.printStackTrace()
        }
        


        // 3. Direct Update via AppWidgetManager
        try {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, WeatherWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            for (appWidgetId in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.weather_widget)
                views.setTextViewText(R.id.widget_city, city)
                views.setTextViewText(R.id.widget_temp, "$temp°")
                
                // 1. Immediate Update (Text)
                appWidgetManager.updateAppWidget(appWidgetId, views)
                
                // 2. Load Icon Async (Small, fast)
                val iconUrl = try { JSONObject(dataJson).optString("iconUrl", "") } catch(e:Exception){""}
                if (iconUrl.isNotEmpty()) {
                    Executors.newSingleThreadExecutor().execute {
                        try {
                            val url = URL(iconUrl)
                            val bmp = BitmapFactory.decodeStream(url.openConnection().getInputStream())
                            if (bmp != null) {
                                views.setImageViewBitmap(R.id.widget_icon, bmp)
                                appWidgetManager.updateAppWidget(appWidgetId, views)
                            }
                        } catch (e: Exception) { e.printStackTrace() }
                    }
                }

                // 3. Load Main Background Image Async (Heavy)
                if (imageUrl.isNotEmpty()) {
                    Executors.newSingleThreadExecutor().execute {
                        try {
                            // First connection: get image dimensions
                            val urlForBounds = URL(imageUrl)
                            val boundsConnection = urlForBounds.openConnection()
                            val boundsStream = boundsConnection.getInputStream()
                            
                            val options = BitmapFactory.Options()
                            options.inJustDecodeBounds = true
                            BitmapFactory.decodeStream(boundsStream, null, options)
                            boundsStream.close()
                            
                            // Calculate scale
                            var scale = 1
                            while (options.outWidth / scale / 2 >= 400 && options.outHeight / scale / 2 >= 400) {
                                scale *= 2
                            }
                            
                            // Second connection: decode
                            val urlForDecode = URL(imageUrl)
                            val decodeConnection = urlForDecode.openConnection()
                            val decodeStream = decodeConnection.getInputStream()
                            
                            val decodeOptions = BitmapFactory.Options()
                            decodeOptions.inSampleSize = scale
                            
                            val bitmap = BitmapFactory.decodeStream(decodeStream, null, decodeOptions)
                            decodeStream.close()
                            
                            if (bitmap != null) {
                                // Create NEW RemoteViews for the image update to ensure clean state or reuse?
                                // Reusing 'views' is risky across threads if modified. Safer to use the one we have since we serialize it.
                                views.setImageViewBitmap(R.id.widget_image, bitmap)
                                appWidgetManager.updateAppWidget(appWidgetId, views)
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
