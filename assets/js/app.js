/*document.addEventListener("click", function() {
    let elem = document.documentElement;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { // Safari
            elem.webkitRequestFullscreen();
        }
    }
});*/

{% unless pages.url == '/sukses' %}
    let backPressCount = 0;
    let backPressTimeout;

    async function showToast(message) {
      const toast = document.createElement('ion-toast');
      toast.message = message;
      toast.duration = 2000;
      document.body.appendChild(toast);
      await toast.present();
    }

    window.history.pushState(null, null, location.href);

    window.addEventListener('popstate', function(event) {
      if (backPressCount === 0) {
        backPressCount++;
        showToast('Tekan sekali lagi untuk keluar.');
        
        window.history.pushState(null, null, location.href);

        backPressTimeout = setTimeout(() => {
          backPressCount = 0;
        }, 2000);

      } else {
        clearTimeout(backPressTimeout);
        if (window.navigator.app) {
            window.navigator.app.exitApp();
        } else {
            window.location.href = '/'; 
        }
      }
    });
{% endunless %}
