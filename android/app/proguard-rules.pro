# =============================================================================
#  Regles de conservation de Chap.ci
#
#  Capacitor apporte deja les siennes (consumerProguardFiles dans
#  @capacitor/android) : elles gardent tout ce qui porte @CapacitorPlugin,
#  tout ce qui etend com.getcapacitor.Plugin, et les greffons Cordova. On ne
#  les recopie pas ici — elles s'appliquent toutes seules.
#
#  Ce fichier ne porte donc que ce que Capacitor ne peut pas deviner.
# =============================================================================

# Le pont JavaScript <-> Java. Une methode annotee @JavascriptInterface n'est
# appelee QUE depuis le JavaScript de la WebView : R8 ne voit aucun appelant et
# la supprimerait, ce qui couperait l'application de son propre code.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Les quatre greffons reellement installes, nommes explicitement. Les regles de
# Capacitor les couvrent deja ; on double la garde parce qu'un greffon absent
# ne se voit pas a la compilation — seulement sur un telephone, quand la
# position ou la barre de statut cesse de repondre.
-keep class com.capacitorjs.plugins.** { *; }
-keep class ci.chap.app.** { *; }

# Les noms de fichiers et de lignes dans les rapports de plantage. Sans cela,
# un plantage remonte de la Play Console comme une suite de lettres illisible.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Les ANNOTATIONS doivent survivre, et c'est le point le plus fragile.
#
# Capacitor ne connaît pas ses greffons à la compilation : il lit
# @CapacitorPlugin PAR RÉFLEXION au démarrage (PluginHandle.getPluginAnnotation)
# pour en tirer le nom du greffon et les permissions qu'il réclame. Si R8
# efface les annotations d'exécution — ce qu'il fait par défaut, elles ne sont
# référencées par aucun appel visible — les greffons se chargent sans nom et
# l'application démarre sur une coquille vide.
#
# Le fichier proguard-android-optimize.txt d'Android en garde déjà une partie.
# On ne s'en remet pas à lui : ce défaut-là ne se voit qu'une fois installé sur
# un vrai téléphone, jamais à la compilation.
-keepattributes *Annotation*, RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations, AnnotationDefault, Signature, InnerClasses, EnclosingMethod, Exceptions

-keep @interface com.getcapacitor.annotation.** { *; }
-keep class com.getcapacitor.annotation.** { *; }
-keep @interface com.getcapacitor.** { *; }

# Le pont lui-même. R8 peut le RENOMMER sans dommage (les références sont
# compilées), mais pas en supprimer les entrées appelées depuis le JavaScript.
-keep class com.getcapacitor.JSExport { *; }
-keepclassmembers class com.getcapacitor.** {
    public <methods>;
}
