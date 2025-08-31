
window.RoleType = {
	ROLE_None: 0,
	ROLE_Terminator: 1,
	ROLE_Saviour: 2,
	ROLE_HumanBoss: 3,
	ROLE_MasterHero: 4,
	ROLE_MasterHunter: 5,
	ROLE_AsceticHero: 6,
	ROLE_MysticHero: 7,
	ROLE_MechanicHero: 8,
	ROLE_BladeHero: 9,
	ROLE_BlazeHero: 10,
	ROLE_EvilTerminator: 11,
	ROLE_DemonTerminator: 12,
	ROLE_VoidTerminator: 13,
	ROLE_QueenTerminator: 14,
	ROLE_OutlawterMinator: 15,
	ROLE_ArmoredTerminator: 16,
	ROLE_ViperTerminator: 17,
};
var MOD_Nano4Ability = 23;
window.MOD_ZS = 28;

// 大灾变计分板
Vue.component('zbs-scoreboard', {
	props: {
		left: [String, Number],
		right: [String, Number],
		round: [String, Number],
		leftColor: { type: String, default: '#fff' },
		rightColor: { type: String, default: '#77BFFF' },
		width: { type: [Number, String], default: 480 }
	},
	computed: {
		leftDigits() { 
			return (this.left + "").replace(/\D/g,'').split('') 
		},
		rightDigits() { 
			return (this.right + "").replace(/\D/g,'').split('') 
		},
		roundDigits() { 
			return (this.round + "").replace(/\D/g,'').split('') 
		},
	},
	template: `
	<div class="zbs-scoreboard" :style="{ width: width + 'px'}">
		<img class="zbs-bg" src="UI/zbs/zbsboard.png" alt="board"/>
		<div class="score side-left" >
		<span v-for="(d,i) in leftDigits" :key="'l'+i" class="digit" :style="{ 'background-color': leftColor }" :class="'n'+d"></span>
		</div>
		<div class="score side-right" >
		<span v-for="(d,i) in rightDigits" :key="'r'+i" class="digit" :style="{ 'background-color': rightColor }" :class="'n'+d"></span>
		</div>
		<div class="round">
		<div class="round-num">
			<span v-for="(d,i) in roundDigits" :key="'m'+i" class="digit" :style="{ 'background-color': '#fff' }" :class="'n'+d"></span>
		</div>
		</div>
	</div>
	`
});

window.vueGame = new Vue({
	el: '#app',
	data: {
		debug:false,
		display:false,
		bIsAlive:false,

		iRole:0,
		iScore:0,
		iGameMod:0,

		showHintText : true, 
		hintText : 'notice text',

		skillShow : false, 
		skillTimer: null, 

		skill_coolDown : 0,
		skill_marginLeft : '0',
		// skill_text_marginLeft : '-34px',
		skill_maskImage: 'linear-gradient(to right, black 50%, transparent 50%)',
		skill_image : '',

		ability_show : false,
		ability_marginLeft : '0',
		ability_marginRight : '-34px',
		ability_maskImage: 'linear-gradient(to right, black 50%, transparent 50%)',
		ability_image : '',
		ability_timer: null, 
		ability_coolDown : 0,

		Hero_Slot_Show: false,
		Hero_Slot_Timer: null,
		Hero_Select_Name: '幽灵猎手',
		Hero_Slot_Photo:'UI/NANO4_ABILITY/Hero_Slot_Photo_00.PNG',
		Hero_Fx_Exp_LvUp:'UI/Effect/Fx_Exp_LvUp/Fx_Exp_LvUp_01.PNG',
		Hero_Fx_HeroSelected:'UI/Effect/Fx_HeroSelected/Fx_HeroSelected_01.PNG',
		Hero_Fx_frame: 0,
		Hero_Fx_frameTimer: null,
		Hero_Fx_totalFrames: 17,
		
		Fx_Glass_Show: false,
		Fx_Glass_Timer: null,
		Fx_Glass_frame: 0,
		Fx_Glass_IMG:'UI/frame/glass/0.png',

		teamScore: 0, teamRounds : 0
	},
	created: function () {
		this.display = true;
	},
	methods: {
		showHeroGlass: function () {
			if(window.engine) {
				// 全屏更新太卡了，现改为调api播放帧图
				acg.DrawFrameTexture("MasterGlass", 1.2 );
			}else{
				// 仅用于html预览
				this.Fx_Glass_Show = false;
				vueGame.$data.Fx_Glass_IMG =  'UI/frame/glass/0.PNG';
				this.$nextTick(() => {
					this.Fx_Glass_Show = true;
				});
				
				if (vueGame.$data.Fx_Glass_Timer) {
					clearInterval(vueGame.$data.Fx_Glass_Timer);
				}

				var finishTime = Date.now() + 35 * 39;
				vueGame.$data.Fx_Glass_Timer = setInterval(() => { // 冷却倒数
					var frame = Math.max(0, Math.round((finishTime - Date.now()) / 35));
					if (frame <= 0) {
						clearInterval(vueGame.$data.Fx_Glass_Timer);
						vueGame.$data.Fx_Glass_Timer = null;
						vueGame.$data.Fx_Glass_Show = false;
					} else {
						// console.log((38 - frame));
						vueGame.$data.Fx_Glass_IMG =  'UI/frame/glass/'+ (38 - frame) +'.PNG';
					}
				}, 35);
			}

		},
		showHeroSlot: function () {

			this.Hero_Fx_frame = 0;
			this.Hero_Slot_Show = false;
			this.$nextTick(() => {
				this.Hero_Slot_Show = true;
			});

			if (this.Hero_Fx_frameTimer) {
				clearTimeout(this.Hero_Fx_frameTimer);
				this.Hero_Fx_frameTimer = null;
			}
			setTimeout(() => {
				vueGame.playAnimation();
			}, 100);

			if (this.Hero_Slot_Timer) {
				clearTimeout(this.Hero_Slot_Timer);
				this.Hero_Slot_Timer = null;
			}

			this.Hero_Slot_Timer = setTimeout(() => {
				vueGame.Hero_Slot_Timer = null;
				vueGame.Hero_Slot_Show = false;
			}, 2200);
		},
		playAnimation: function () {
			this.Hero_Fx_frame = this.Hero_Fx_frame+1;
			if (this.Hero_Fx_frame > this.Hero_Fx_totalFrames) {
				this.Hero_Fx_frame = 0;
				return;
			}
	
			var index = ('00' + (this.Hero_Fx_frame)).slice(-2); 
			// console.log("[playAnimation]"+index);
			this.Hero_Fx_Exp_LvUp = 'UI/Effect/Fx_Exp_LvUp/Fx_Exp_LvUp_'+ index +'.PNG';
			if	(this.Hero_Fx_frame <=15 ) {
				this.Hero_Fx_HeroSelected = 'UI/Effect/Fx_HeroSelected/Fx_HeroSelected_'+ index +'.PNG';
			}
	
			if (this.Hero_Fx_frameTimer) {
				clearTimeout(this.Hero_Fx_frameTimer);
				this.Hero_Fx_frameTimer = null;
			}
			this.Hero_Fx_frameTimer = setTimeout(() => {
				vueGame.Hero_Fx_frameTimer = null;
				vueGame.playAnimation();
			}, 100);
		},
		useSkill:function (SkillType,coolDownTime) {
			if (this.skillTimer) {
				clearInterval(this.skillTimer);
			}

			this.skill_coolDown = coolDownTime;
			var finishTime = Date.now() + coolDownTime * 1000;

			this.skillTimer = setInterval(() => { // 冷却倒数
				var remainingTime = Math.max(0, Math.round((finishTime - Date.now()) / 1000));
				vueGame.$data.skill_coolDown = remainingTime;
				if (remainingTime <= 0) {
					clearInterval(vueGame.$data.skillTimer);
					vueGame.$data.skillTimer = null;
				}
			}, 1000);
		},
		useAbility:function (coolDownTime) {
			if (this.ability_timer) {
				clearInterval(this.ability_timer);
			}

			window.fakePlayer.m_iAbilityStatus = 2;
			this.m_iAbilityStatus = 2;
			this.ability_coolDown = coolDownTime;
			var finishTime = Date.now() + coolDownTime * 1000;

			this.ability_timer = setInterval(() => { // 冷却倒数
				var remainingTime = Math.max(0, Math.round((finishTime - Date.now()) / 1000));
				vueGame.$data.ability_coolDown = remainingTime;
				if (remainingTime <= 0) {
					clearInterval(vueGame.$data.ability_timer);
					vueGame.$data.ability_timer = null;
				}
			}, 1000);
		},
		useSpace: function (coolDownTime ) {
			if (this.ability_timer) {
				clearInterval(this.ability_timer);
			}

			this.skill_coolDown = coolDownTime;
			var finishTime = Date.now() + coolDownTime * 1000;

			this.ability_timer = setInterval(() => { // 冷却倒数
				var remainingTime = Math.max(0, Math.round((finishTime - Date.now()) / 1000));
				vueGame.$data.skill_coolDown = remainingTime;
				if (remainingTime <= 0) {
					clearInterval(vueGame.$data.ability_timer);
					vueGame.$data.ability_timer = null;
				}
			}, 1000);
		},
		useFakeSkill: function () {
			if (this.iRole == RoleType.ROLE_BladeHero) {
				if(this.ability_show){
					window.fakePlayer.m_iAbilityStatus = 0;
				} else {
					window.fakePlayer.m_iAbilityStatus = 1;
				}
			} else {
				this.useSkill(1,5);
			}
		},
		useFakeAbility: function () {
			vueGame.useAbility(5);
		},
		
		demo_Kills(){
			window.HudHint.show({ src:'./UI/zbs/zbskill.png', duration:100,fadeOutMs: 618, enterEffect:'fade-zoom', leaveEffect:'slide-up', x:.5, y:.2, center:true, channel:22, zIndex:100030 });
		},
		demo_RoundClear(){
			window.HudHint.show({ src:'./UI/zbs/roundclear.png', duration:1500, fadeOutMs:800,enterEffect:'fade-zoom', leaveEffect:'fade', x:.5, y:0.12, center:true, zIndex:100000 });
		},
		demo_Tooltip(){
			window.HudHint.show({ src:'./UI/zbs/roundfail.png', duration:1200,enterEffect:'slide-down', leaveEffect:'fade', x:.9, y:.12, center:true, zIndex:100010 });
		},
	}
})


class CHudGamePlay extends CHudBase {
	constructor() {
		super();
		this.frame = 0;
		this.totalFrames = 15;
		this.timer = null;
		this.frameTimer = null;
	}

	init() {
		client.hookUserMessage("UpdateHero", this.MsgFunc_UpdateHero.bind(this));
		client.hookUserMessage("ZombieSkill", this.MsgFunc_ZombieSkill.bind(this));
		client.hookUserMessage("ZombieEvent", this.MsgFunc_ZombieEvent.bind(this));

		acg.PrecacheTexture("MasterGlass","fire_spr/MasterGlass");
	}


	MsgFunc_ZombieEvent(msg) {
		var ZombieEventType = msg.readByte();
		if (ZombieEventType == 107) {
			vueGame.showHeroGlass();
		}
	}

	MsgFunc_UpdateHero(msg) {
		if (vueGame.$data.iGameMod != MOD_Nano4Ability){
			return;
		}
		var newUpdateHero = msg.readByte();
		if (newUpdateHero == 2){ // 幽灵猎手出现
			var humanRole = msg.readByte();
			if (humanRole >= RoleType.ROLE_EvilTerminator){
				vueGame.$data.Hero_Slot_Photo = 'UI/NANO4_ABILITY/Hero_Slot_PhotoN_00.PNG';
				switch (humanRole) {
					case RoleType.ROLE_EvilTerminator: vueGame.$data.Hero_Select_Name = '地狱终结者';break;
					case RoleType.ROLE_DemonTerminator: vueGame.$data.Hero_Select_Name = '钢铁终结者';break;
					case RoleType.ROLE_VoidTerminator: vueGame.$data.Hero_Select_Name = '虚空终结者';break;
					case RoleType.ROLE_QueenTerminator: vueGame.$data.Hero_Select_Name = '女皇终结者';break;
					case RoleType.ROLE_OutlawterMinator: vueGame.$data.Hero_Select_Name = '暴君终结者';break;
					case RoleType.ROLE_ArmoredTerminator: vueGame.$data.Hero_Select_Name = '装甲终结者';break;
					case RoleType.ROLE_ViperTerminator: vueGame.$data.Hero_Select_Name = '毒蝰终结者';break;
					default:vueGame.$data.Hero_Select_Name = '';break;
				}
			} else if (humanRole >= RoleType.ROLE_HumanBoss){
				var index = humanRole - RoleType.ROLE_HumanBoss;
				vueGame.$data.Hero_Slot_Photo = 'UI/NANO4_ABILITY/Hero_Slot_Photo_0'+ index +'.PNG';
				switch (humanRole) {
					case RoleType.ROLE_HumanBoss: vueGame.$data.Hero_Select_Name = '幽灵猎手';break;
					case RoleType.ROLE_MasterHero: vueGame.$data.Hero_Select_Name = '终极猎手';break;
					case RoleType.ROLE_MasterHunter: vueGame.$data.Hero_Select_Name = '时空猎手';break;
					case RoleType.ROLE_AsceticHero: vueGame.$data.Hero_Select_Name = '圣拳猎手';break;
					case RoleType.ROLE_MysticHero: vueGame.$data.Hero_Select_Name = '救赎猎手';break;
					case RoleType.ROLE_MechanicHero: vueGame.$data.Hero_Select_Name = '机械猎手';break;
					case RoleType.ROLE_BladeHero: vueGame.$data.Hero_Select_Name = '恶魔剑客';break;
					case RoleType.ROLE_BlazeHero: vueGame.$data.Hero_Select_Name = '风火哪吒';break;
					default:vueGame.$data.Hero_Select_Name = '';break;
				}
			} else {
				return;
			}

			vueGame.showHeroSlot();
		}
	}

	MsgFunc_ZombieSkill(msg) {
		var SkillType = msg.readByte();
		var coolDownTime = msg.readByte();

		if (SkillType == 1) {
			vueGame.useSkill(SkillType,coolDownTime);
		} else if (SkillType == 2){
			vueGame.useAbility(coolDownTime);
		} else if (SkillType == 3){
			vueGame.useSpace(coolDownTime);
		}
	}

	onThink() {
		var player = clientAPI.getLocalCSPlayer();
		if (!player) {
			return;
		}

		vueGame.$data.debug = player.debug;
		vueGame.$data.iRole = player.m_iRole;
		vueGame.$data.iScore = player.m_iScore;
		vueGame.$data.iGameMod = globals.game_mod;
		vueGame.$data.bIsAlive = player.m_bIsAlive;
		vueGame.$data.ability_show =  player.m_iAbilityStatus;

		let team_ct = globals.team_ct;
		if (team_ct) {
			let teamScore = team_ct.score < player.m_iScore ? player.m_iScore : team_ct.score;
			vueGame.$data.teamScore = teamScore;
			vueGame.$data.teamRounds = team_ct.rounds + 1;
		}
		
		if (vueGame.$data.ability_show) {
			switch (player.m_iRole) {
				case RoleType.ROLE_MechanicHero:
					vueGame.$data.ability_image = 'UI/NANO4_ABILITY/Skill/SKILL_MECHANICHERO_DEFAULT_TURRET.PNG'
					break;
				case RoleType.ROLE_MysticHero:
					vueGame.$data.ability_image = 'UI/NANO4_ABILITY/Skill/SKILL_MYSTICHERO_DEFAULT_THERAPY.PNG'
					break;
				case RoleType.ROLE_BladeHero:
					vueGame.$data.ability_image = 'UI/NANO4_ABILITY/Skill/SKILL_GHOSTBLADE_DEFAULT_DEFENSE.PNG'
					break;
			}
			if (vueGame.$data.ability_show == 1) {
				vueGame.$data.ability_marginLeft = '-34px';
				vueGame.$data.ability_marginRight = '-0';
				vueGame.$data.ability_maskImage = 'linear-gradient(to left, black 50%, transparent 50%)';
			} else {
				vueGame.$data.ability_marginLeft = '0';
				vueGame.$data.ability_marginRight = '-34px';
				vueGame.$data.ability_maskImage = 'linear-gradient(to right, black 50%, transparent 50%)';
			}
		}

		vueGame.$data.skillShow = player.m_bIsAlive && player.m_iRole >= RoleType.ROLE_MasterHero;
		switch (player.m_iRole) {
			case RoleType.ROLE_MasterHero:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_MASTERHERO_DEFAULT_SLASH.PNG'
				break;
			case RoleType.ROLE_MasterHunter:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_MASTERHUNTER_DEFAULT_INVISIBLE.PNG'
				break;
			case RoleType.ROLE_MechanicHero:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_MECHANICHERO_DEFAULT_ARCANE.PNG'
				break;
			case RoleType.ROLE_AsceticHero:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_ASCETICHERO_DEFAULT_SHIELD.PNG'
				break;
			case RoleType.ROLE_MysticHero:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_MYSTICHERO_DEFAULT_FROZEN.PNG'
				break;
			case RoleType.ROLE_EvilTerminator:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_EVILTERMINATOR_DEFAULT_FIREBALL.PNG'
				break;
			case RoleType.ROLE_DemonTerminator:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_DEMONTERMINATOR_DEFAULT_SHIELD.PNG'
				break;
			case RoleType.ROLE_VoidTerminator:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_VOIDTERMINATOR_ULTIMATE_INSTALL.PNG'
				break;
			case RoleType.ROLE_QueenTerminator:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_QUEENTERMINATOR_DEFAULT_INVISIBLE.PNG'
				break;
			case RoleType.ROLE_OutlawterMinator:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_OUTLAWTERMINATOR_DEFAULT_SHATTER.PNG'
				break;
			case RoleType.ROLE_BladeHero:
				vueGame.$data.skill_image = 'UI/NANO4_ABILITY/Skill/SKILL_GHOSTBLADE_DEFAULT_STANCECHANGE.PNG'
				break;
			default:
				break;
		}
		if (!player.m_iSkillStatus && vueGame.$data.skill_coolDown <= 0  ) {
			vueGame.$data.skill_marginLeft = '-34px';
			vueGame.$data.skill_maskImage = 'linear-gradient(to left, black 50%, transparent 50%)';
		} else {
			vueGame.$data.skill_marginLeft = '0';
			vueGame.$data.skill_maskImage = 'linear-gradient(to right, black 50%, transparent 50%)';
		}
	}
}

window.GamePlay = new CHudGamePlay();
getHudList().push(window.GamePlay);


window.fakePlayer = {
	debug:true,
	m_iScore:0,
	m_bIsAlive:true,
	m_iSkillStatus:0,
	m_iAbilityStatus:1,
	m_iRole:RoleType.ROLE_MechanicHero,
};
window.fakeGlobal = {
	game_mod:MOD_Nano4Ability,
};
if (typeof clientAPI === 'undefined') {

	// vueGame.showHeroSlot();
	// vueGame.Hero_Slot_Show = true;

	class ClientAPIFake {
		getActiveWeapon() {return {};}
		getLocalPlayer() {return {};}
		getLocalCSPlayer() {return window.fakePlayer}
		getWpnData(ent) {return {};}
		addEventHandler(type, callback) {}
		hookUserMessage(name, callback) {}
		listenForGameEvent(name, callback) {}
		getPlayerTeam(index) {return null;}
		getPlayerName(index) {return null;}
		lookupTextMessageString(msg) {return null;}
		pollEvent() {}
	}
	clientAPI = new ClientAPIFake();
	engineAPI =  {
		getPropertyOfGlobalVars :function(i) {
			return fakeGlobal[i];
		}
	};
}


let acg = {
	TexID:{},
	PrecacheTexture: (name,tex) => {
		this.TexID[name] = fireAPI.PrecacheTexture(tex);
	},
	DrawFrameTexture: (name, second) => fireAPI.DrawFrameTexture(this.TexID[name], second),
	alert: (msg,title) => fireAPI.Alert(msg, title ? title:"info")
};
window.acg  = acg;
window.alert  = acg.alert;
