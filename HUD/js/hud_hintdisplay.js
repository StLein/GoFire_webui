
const CSRoundEnd_RoundClear = 19;
const CSRoundEnd_RoundFail = 20;

let	HintClear_Timer = null;
const clearTimer = (timerRef) => timerRef && (clearTimeout(timerRef), null);

// ===== performance_now + RAF 兼容 =====
var __origin = Date.now ? Date.now() : new Date().getTime();
var __lastNow = 0;
function performance_now() {
  var ms = (Date.now ? Date.now() : new Date().getTime()) - __origin;
  if (ms <= __lastNow) { __lastNow += 0.1; return __lastNow; } // 确保递增
  __lastNow = ms;
  return ms;
}

const now = performance_now;
var RAF = window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| function(cb){ return setTimeout(function(){ cb(now()); }, 16); };
var CAF = window.cancelAnimationFrame
		|| window.webkitCancelAnimationFrame
		|| function(id){ clearTimeout(id); };

// ====== 动画效果映射 ======
var FX = {
	'fade'      : { enterFrom:'none',              leaveTo:'none' },
	'fadezoom'  : { enterFrom:'scale(0.94)',       leaveTo:'scale(0.94)' },
	'slideup'   : { enterFrom:'translateY(24px)',  leaveTo:'translateY(-48px)' },
	'slidedown' : { enterFrom:'translateY(-24px)', leaveTo:'translateY(24px)' },
	'slideleft' : { enterFrom:'translateX(-24px)', leaveTo:'translateX(24px)' },
	'slideright': { enterFrom:'translateX(24px)',  leaveTo:'translateX(-24px)' }
};
function norm(name, fallback){
	if(!name) return fallback;
	var s = (''+name).toLowerCase().replace(/[-_ ]/g,''); // fade-zoom -> fadezoom
	return FX[s] ? s : fallback;
}
var EASE_IN  = 'cubic-bezier(.22,.61,.36,1)';
var EASE_OUT = 'cubic-bezier(.4,0,.2,1)';
function lerp(a,b,t){ return a+(b-a)*t; }
function ease(t){ return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }


// ========= HudHintAnim 组件 =========
(function(){
let __elMap = Object.create(null) // DOM引用缓存
Vue.component('hud-anim', {
	name: 'HudAnim',
	props: {
		// 组件行为
		registerGlobalAs: { type: String, default: 'HUDAnim' }, // 全局注册
		autoChannelStart: { type: Number, default: 1000 },

		// 默认参数
		defaultDuration : { type: Number, default: 3500 },
		defaultFadeInMs : { type: Number, default: 220  },
		defaultFadeOutMs: { type: Number, default: 260  },
		defaultEnter    : { type: String, default: 'fade-zoom' },
		defaultLeave    : { type: String, default: 'fade' },
		defaultZIndex   : { type: Number, default: 99999 },
		defaultMaxW     : { type: String,  default: '68vw' },
		defaultMaxH     : { type: String,  default: '72vh' }
	},
	data: function(){
		return {
			channels: {},                // {channelId: [item, ...]}
			nextAutoChannel: this.autoChannelStart,
		};
	},
	computed: {
		allActive: function(){
			var arr = [];
			for (var k in this.channels) {
			var list = this.channels[k];
			if (list && list.length) { arr.push.apply(arr, list); }
			}
			return arr;
		}
	},
	methods: {
	// ---- 取$refs DOM，否则__elMap， 都取不到用querySelector ----
	_getEl(it){
		// 1) 直接从 $refs 拿
		let el = this.$refs['ov-'+it.id];
		if(Array.isArray(el)) el = el[0];
		if(el) { __elMap[it.id]=el; return el; }
		// 2) 从缓存拿
		if(__elMap && __elMap[it.id]) return __elMap[it.id];
		// 3) DOM 兜底（极端场景）
		el = document.querySelector('[data-ovid="'+it.id+'"]');
		if(el){ __elMap[it.id]=el; }
		return el;
	},

	// ------- 样式 -------
	posStyle: function(it){
		function clamp(v){ v=+v||0; return Math.max(0, Math.min(1, v)); }
		return {
		left: clamp(it.x)*100+'%',
		top : clamp(it.y)*100+'%',
		transform: it.center ? 'translate(-50%, -50%)' : 'none'
		};
	},
	boxStyle: function(it){ return { maxWidth: it.maxW, maxHeight: it.maxH }; },

	// ------- 通道 -------
	_allocAutoChannel: function(){ return this.nextAutoChannel++; },
	_resolveChannel: function(c){
		var n = parseInt(c,10);
		return (Number.isInteger(n) && n>=1 && n<=999) ? n : this._allocAutoChannel();
	},
	_ensureChannel: function(id){
		if (!this.channels[id]) this.$set(this.channels, id, []);
		return this.channels[id];
	},

	// ------- 动画（优先WAAPI） -------
	_startEnter: function(it){
		var el = this._getEl(it);
		if (!el) {
		return this.$nextTick(function(){ el = this._getEl(it); if (el) this._runEnter(el,it); }.bind(this));
		}
		this._runEnter(el, it);
	},
	_runEnter: function(el, it){
		try{
		var fx = FX[it._enter];
		el.style.opacity   = '0';
		el.style.transform = fx.enterFrom;
		if (el.animate){
			it._enterAnim = el.animate([
			{ opacity: 0, transform: fx.enterFrom },
			{ opacity: 1, transform: 'none' }
			], { duration: it.fadeInMs, easing: EASE_IN, fill: 'forwards' });
		} else {
			var start = now(); var dur = it.fadeInMs||200; var from = fx.enterFrom;
			var self = this;
			var raf = function(){
			var t = Math.min(1, (now()-start)/dur), k = ease(t);
			var tr = 'none';
			if (from.indexOf('scale(')===0){
				var s0 = parseFloat(from.match(/scale\(([^)]+)\)/)[1]);
				tr = 'scale(' + lerp(s0,1,k) + ')';
			} else if (from.indexOf('translateX(')===0){
				var x0 = parseFloat(from.match(/translateX\(([-\d.]+)px\)/)[1]);
				tr = 'translateX(' + lerp(x0,0,k) + 'px)';
			} else if (from.indexOf('translateY(')===0){
				var y0 = parseFloat(from.match(/translateY\(([-\d.]+)px\)/)[1]);
				tr = 'translateY(' + lerp(y0,0,k) + 'px)';
			}
			el.style.transform = tr;
			el.style.opacity   = String(k);
			if (t<1) { it._rafIn = RAF(raf); }
			};
			it._rafIn = RAF(raf);
		}
		}catch(e){
		el.style.opacity='1'; el.style.transform='none';
		}
	},
	_startLeave: function(it, onDone){
		var el = this._getEl(it);
		if (!el){ if(onDone) onDone(); return; }
		var fx = FX[it._leave];

		// 结束入场
		if (it._enterAnim){ try{ it._enterAnim.finish(); }catch(e){} try{ it._enterAnim.cancel(); }catch(e){} it._enterAnim=null; }
		if (it._rafIn){ CAF(it._rafIn); it._rafIn=null; }

		el.style.opacity='1'; el.style.transform='none';

		if (el.animate){
		it._leaveAnim = el.animate([
			{ opacity: 1, transform: 'none' },
			{ opacity: 0, transform: fx.leaveTo }
		], { duration: it.fadeOutMs, easing: EASE_OUT, fill: 'forwards' });
		it._leaveAnim.onfinish = function(){ it._leaveAnim=null; onDone && onDone(); };
		} else {
		var start = now(); var dur = it.fadeOutMs||200; var to = fx.leaveTo;
		var raf = function(){
			var t = Math.min(1, (now()-start)/dur), k = ease(t);
			var tr = 'none';
			if (to.indexOf('scale(')===0){
			var s1 = parseFloat(to.match(/scale\(([^)]+)\)/)[1]);
			tr = 'scale(' + lerp(1,s1,k) + ')';
			} else if (to.indexOf('translateX(')===0){
			var x1 = parseFloat(to.match(/translateX\(([-\d.]+)px\)/)[1]);
			tr = 'translateX(' + lerp(0,x1,k) + 'px)';
			} else if (to.indexOf('translateY(')===0){
			var y1 = parseFloat(to.match(/translateY\(([-\d.]+)px\)/)[1]);
			tr = 'translateY(' + lerp(0,y1,k) + 'px)';
			}
			el.style.transform = tr;
			el.style.opacity   = String(1-k);
			if (t<1) { it._rafOut = RAF(raf); }
			else { it._rafOut=null; onDone && onDone(); }
		};
		it._rafOut = RAF(raf);
		}
	},

	/**
	 * show(opts)
	 * opts: {
	 *   src, duration, fadeInMs, fadeOutMs, enterEffect, leaveEffect,
	 *   breathe, alt, x, y, center,  zIndex, maxW, maxH, channel
	 * }
	 */
	show: function(opts){
		opts = opts || {};
		var item = {
		id:  (this._uidSeed = (this._uidSeed||0) + 1),
		src: opts.src || '',
		duration : 'duration'  in opts ? opts.duration  : this.defaultDuration,
		fadeInMs : 'fadeInMs'  in opts ? opts.fadeInMs  : this.defaultFadeInMs,
		fadeOutMs: 'fadeOutMs' in opts ? opts.fadeOutMs : this.defaultFadeOutMs,
		breathe: !!opts.breathe,
		alt: opts.alt || '',
		x: 'x' in opts ? opts.x : 0.5,
		y: 'y' in opts ? opts.y : 0.5,
		center: 'center' in opts ? !!opts.center : true,
		zIndex: 'zIndex' in opts ? opts.zIndex : this.defaultZIndex,
		maxW: 'maxW' in opts ? opts.maxW : this.defaultMaxW,
		maxH: 'maxH' in opts ? opts.maxH : this.defaultMaxH,
		channel: this._resolveChannel(opts.channel),
		_enter: norm(opts.enterEffect || this.defaultEnter, 'fadezoom'),
		_leave: norm(opts.leaveEffect || this.defaultLeave, 'fade'),
		_timer:null, _enterAnim:null, _leaveAnim:null, _rafIn:null, _rafOut:null, _leaving:false
		};
		var list = this._ensureChannel(item.channel);
		list.push(item);

		this.$nextTick(function(){
		this._startEnter(item);
		if (item.duration > 0) {
			item._timer = setTimeout(function(){ this.hideById(item.id); }.bind(this), item.duration);
		}
		}.bind(this));

		return { id:item.id, channel:item.channel };
	},
	draw_anim: function(o){ return this.show(o); },
	show_anim: function(src, conf){ conf = conf || {}; conf.src = src; if(!('duration' in conf)) conf.duration=0; return this.show(conf); },

	hideById: function(id){
		for (var cid in this.channels){
		var list = this.channels[cid];
		if (!list || !list.length) continue;
		var it = null, i;
		for (i=0;i<list.length;i++){ if(list[i].id===id){ it=list[i]; break; } }
		if (it){
			if (it._timer){ clearTimeout(it._timer); it._timer=null; }
			if (it._leaving) return true;
			it._leaving = true;
			this._startLeave(it, function(){
			var j = list.indexOf(it); if (j>=0) list.splice(j,1);
			if (list.length===0) this.$delete(this.channels, cid);
			if (__elMap) delete __elMap[it.id];
			}.bind(this));
			return true;
		}
		}
		return false;
	},
	hideByChannel: function(cid){
		var list = this.channels[cid];
		if (!list) return false;
		list.slice().forEach(function(it){ this.hideById(it.id); }.bind(this));
		return true;
	},
	hideAll: function(){
		for (var cid in this.channels){ this.hideByChannel(+cid); }
	}
	},

	// ------- 模板 -------
	template: '\
	<div class="hud-anim-root">\
		<div v-for="item in allActive" :key="item.id"\
			class="hud-anim-overlay"\
			:ref="\'ov-\'+item.id"\
			:data-ovid="item.id"\
			:style="{ zIndex: item.zIndex }">\
		<div class="pos-box" :style="posStyle(item)">\
			<div class="anim-box" :class="{ breathe: item.breathe }" :style="boxStyle(item)">\
			<img class="anim-img" :src="item.src" :alt="item.alt||\'hint\'">\
			</div>\
		</div>\
		</div>\
	</div>\
	',

	mounted: function(){
		// 注册全局 API
		window.HudHint={
			show       : this.show.bind(this),
			showManual : this.show_anim.bind(this),
			draw       : this.draw_anim.bind(this),
			hide       : this.hideById.bind(this),
			hideChannel: this.hideByChannel.bind(this),
			hideAll    : this.hideAll.bind(this)
		};
	},
	beforeDestroy: function(){
		// 清理全局引用
		// if (this.registerGlobalAs && window[this.registerGlobalAs] === this) {
		// 	delete window[this.registerGlobalAs];
		// }
	}
});
})();

class CHudHintDisplay extends CHudBase {

	constructor() { super(); }

	init() {
		vueGame.showHintText = false;
		client.hookUserMessage("HintText", this.onMsgHintText.bind(this));
		client.listenForGameEvent("round_end", this.onEventRoundEnd.bind(this));
    	client.listenForGameEvent("player_death", this.onEventPlayerDeath.bind(this));
	}
	onEventRoundEnd(event) {
		var reason = event.getInt("reason");
		// var winningTeam = event.getInt("winner");
		if (reason == CSRoundEnd_RoundClear) {
			window.HudHint.show({
				 src:'./UI/zbs/roundclear.png', duration:1800, fadeOutMs:960,
				 enterEffect:'fade-zoom', leaveEffect:'fade', x:.5, y:0.25, center:true, zIndex:100000 
			});
		} else if (reason == CSRoundEnd_RoundFail) {
			window.HudHint.show({
				 src:'./UI/zbs/roundfail.png', duration:1800, fadeOutMs:960,
				 enterEffect:'fade-zoom', leaveEffect:'fade', x:.5, y:0.25, center:true, zIndex:100000 
			});
		}
	}
	onEventPlayerDeath(event) {
		var player = clientAPI.getLocalCSPlayer();
		var killer = engine.getPlayerForUserID(event.getInt("attacker"));
		var victim = engine.getPlayerForUserID(event.getInt("userid"));

		if (killer == player.index) {
			if (vueGame.iGameMod == window.MOD_ZS) {
				window.HudHint.show({ src:'./UI/zbs/zbskill.png', duration:100,fadeOutMs: 1000, 
					enterEffect:'fade-zoom', leaveEffect:'slide-up', x:.5, y:0.15, center:true, channel:22, zIndex:100030
				});
			}
		}
	}
	onMsgHintText(msg) {
		if (vueGame.iGameMod == window.MOD_ZS) 
			return;
		var str = msg.readString();
		var textMessageStr = client.lookupTextMessageString(str);
		var localStr = localize.find(textMessageStr);
		if (localStr) {
			str = localStr;
		}
		vueGame.hintText = str;
		vueGame.showHintText = true;
		
		clearTimer(HintClear_Timer);
		HintClear_Timer = setTimeout(() => {
			vueGame.showHintText = false;
		}, 4000);
	}
}

getHudList().push(new CHudHintDisplay());
