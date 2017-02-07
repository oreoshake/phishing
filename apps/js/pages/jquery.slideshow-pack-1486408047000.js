(function(c){function a(g,e){var f=c.extend({controlMarkup:'<div class="slideshow-controls"><a class="slideshow-control-playpause">Pause</a><a class="slideshow-control-enlarge">Enlarge</a></div>',transition:5000},e);this.init(g,f)}a.prototype.init=function(h,g){var e=this;this.$el=c(h);this.settings=g;this.items=this.settings.data.items;this.debug("slideshow",h);this.currentSlide=0;this.$el.addClass("slideshow-wrapper");this.$el.html('<div class="slideshow-stage"></div>');this.$stage=this.$el.find(".slideshow-stage");this.$controls=c(this.settings.controlMarkup);this.$controls.on("click",".slideshow-control-playpause",function(i){i.preventDefault();e.playPause();if(e.ticker.isActive){c(this).html("Pause")}else{c(this).html("Play")}});this.$controls.on("click",".slideshow-control-enlarge",function(i){i.preventDefault();c.proxy(e._modalVersion,e,e.items[e.currentSlide])()});this.$el.append(this.$controls);var f=this.$stage.width();if(!this.settings.hasOwnProperty("width")){this.settings.stageWidth=f}this.$stage.height(f*4/6.5);e.transitionTo(0,false);if(this.items.length<2){this.$controls.find(".slideshow-control-playpause").remove();return}this.ticker=new d(this.settings.transition);this.ticker.start();this.ticker.bind("advance",function(){e.transitionTo()})};a.prototype.debug=function(){if(window.console){console.log(Array.prototype.slice.call(arguments))}};a.prototype._getVersionByWidth=function(e,h){console.log(e);var j=0;for(var g=0;g<e.versions.length;g++){var f=e.versions[g];if(f.width>h){return f}if(f.width>e.versions[j].width){j=g}}return e.versions[j]};a.prototype.playPause=function(e){if(!this.ticker){return}if(this.ticker.isActive){this.ticker.stop()}else{if(!!e){this.transitionTo()}this.ticker.start()}};a.prototype.showControls=function(e){if(e){this.$controls.stop(true,true).fadeIn()}else{this.$controls.show()}};a.prototype.hideControls=function(e){if(e){this.$controls.stop(true,true).fadeOut()}else{this.$controls.hide()}};a.prototype.transitionTo=function(g,f){var h=this;if(isNaN(g)){g=this.getNextNatural()}if(g>=this.items.length){return}var j=this.$stage.find(".slide"+this.currentSlide);var i=this.$stage.find(".slide"+g);this.currentSlide=g;if(i.length==0){i=this.insertSlide(g)}var k="";if(this.items[g].hasOwnProperty("largerVersion")){if(f===false){enlargeAction="show"}else{enlargeAction="fadeIn"}}else{if(f===false){enlargeAction="hide"}else{enlargeAction="fadeOut"}}if(f===false){i.removeClass("slide-offstage")}else{var e=new b({effect:"crossFade"});e.animate(j,i);e.bind("done",function(){h.debug("animation done")})}h.$controls.find(".slideshow-control-enlarge")[enlargeAction]()};a.prototype.insertSlide=function(j){var f=this,l=this.items[j],i=this._getVersionByWidth(l,this.settings.stageWidth);var h=1.5*this.settings.stageWidth;var e=this._getVersionByWidth(l,h);if(e.width>this.settings.stageWidth){l.largerVersion=e}var g='<div class="slide slide'+j+' slide-offstage">';g+='<img src="'+i.url+'" alt="'+l.altText+'">';if(l.caption!=""){g+='<p class="slide-caption">'+l.caption+"</p>"}g+="</div>";var k=c(g);if(l.hasOwnProperty("largerVersion")){k.data("larger-version-url",l.largerVersion.url);k.addClass("has-larger-version");k.on("click",c.proxy(f._modalVersion,f,l))}this.$stage.append(k);return k};a.prototype._modalVersion=function(e){var f=this;window.edlio.openPopup(e.largerVersion.url,e.caption,e.altText,this.$stage.find(".slide"+this.currentSlide+" img"),function(){f.playPause(false)});this.playPause()};a.prototype.getNextNatural=function(){var e=this.currentSlide+1;if(e===this.items.length){e=0}this.debug("Next natural: ",e);return e};function b(e){this.effect=e.effect}MicroEvent.mixin(b);b.prototype.animate=function(f,g){var e=this;g.css({opacity:0,display:"block"}).removeClass("slide-offstage");this.animations[this.effect](f,g,function(){f.css("display","none");e.trigger("done")})};b.prototype.animations={crossFade:function(f,g,e){f.animate({opacity:0});setTimeout(function(){g.animate({opacity:1},e)},300)}};function d(e){this.intervalPeriod=e;this.interval=-1;this.isActive=false;return this}MicroEvent.mixin(d);d.prototype.start=function(){if(this.isActive===true){return}var e=this;this.isActive=true;this.interval=setInterval(function(){e.trigger("advance")},this.intervalPeriod)};d.prototype.stop=function(){clearInterval(this.interval);this.isActive=false};c.fn.slideShow=function(e,f){return this.each(function(){var h=this;if(typeof e==="string"){var g=c.data(this,"slideShow");var i=g[e];if(e.charAt(0)!=="_"&&typeof i==="function"){i.call(g,this,f)}else{g.debug("API call not defined or no show instantiated")}}else{c.data(this,"slideShow",new a(this,e))}})}})((typeof jq111=="function")?jq111:jQuery);