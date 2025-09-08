'use strict'

const util = require('util')

const config = {
	"clouds" : {
		"data": {
			"name": "Data & Intelligence",
			"areas": {
				"ai" : { 
					"name" : "AI", 
					"teams" : {
						"AI" : { "name" : "AI team" },
						"AI Platform" : { "name" : "AI Platform", "active" : "false" }
					}
				},
				"analytics" : { 
					"name" : "Analytics",   
					"teams" : {
						"SI" : { "name" : "Smart Insight" },
						"attribution" : { "name" : "Attribution" },
						"montreal" : { "name" : "Montreal" }
					}
				},
				"dime" : { 
					"name" : "Data-Infrastructure Mgmt. & Enablement", 
					"teams" : {
						"datality" : { "name" : "Datality" },
						"decommagicians" : { "name" : "Decommagicians" }
					}  
				}
			}
		},
		"engagement": {
			"name": "Engagement",
			"areas": {
				"automation": { 
					"name" : "Automation",
					"teams" : {
						"automation" : { "name" : "Automation" },
						"segmentation-execution" : { "name" : "Segmentation Execution" },
						"segmentation-experience" : { "name" : "Segmentation Experience" },
					} 
				},
				"mobile": { 
					"name" : "Mobile",
					"teams" : {
						"…" : { "name" : "…" },
					} 
				},
				"personalization": { 
					"name" : "Personalization",
					"teams" : {
						"…" : { "name" : "…" },
					} 
				},
				"webmail": {
					"name": "Webmail", 
					"teams": {
						"…" : { "name" : "…" },
					}	
				}
			}
		}, 
		// "integrations": {
		// 	"name": "CX & Partner Integrations",
		// 	"areas": [
		// 		{ "integration-apps": "Integration Apps" }
		// 	]
		// },
		// "platform": {
		// 	"name": "Platform",
		// 	"areas": [
		// 		{ "core": "Core" },
		// 		{ "systec": "Systec" }
		// 	]
		// },
		// "none": {
		// 	"name": "None",
		// 	"areas": [
		// 		{ "eme": "Enhanced Marketer Experience" },
		// 		{ "loyalty": "Loyalty" }
		// 	]
		// },
		// "obsolete": {
		// 	"name": "Obsolete",
		// 	"areas": [
		// 		{ "ap": "Automation & Personalization" },
		// 		{ "cdp": "Customer Data Platform" },
		// 		{ "syseng": "System Engineering" }
		// 	]
		// } 
  	}
}

class Cloud {
	constructor( cloudObj ) {
		Object.assign( this, cloudObj )
		
		this.areas = []
		for( const areaKey in cloudObj.areas ) {
			this.areas.push( 
				new Area( areaKey, cloudObj.areas[areaKey], this ) 
			)
		}
	}

	area( id ) {
		return this.areas.find( area => area.key === id )
	}
}

class Area {
	constructor( key, areaObj, cloud ) {
		Object.assign( this, areaObj )
		this.key = key
		this.cloud = cloud
		
		this.teams = []
		for( const teamKey in areaObj.teams ) {
			this.teams.push( new Team( teamKey, areaObj.teams[teamKey], this ) )
		}
	}

	team( id ) {
		return this.teams.find( team => team.key === id )
	}
}

class Team {
	constructor( key, teamObj, area ) {
		Object.assign( this, teamObj )
		this.key = key
		this.area = area
	}
}


for( const c in config.clouds ) {
	console.log( '*********************************************\n' )
	const cloud = new Cloud( config.clouds[c] )
	console.log( 'cloud: ' + cloud.name )
	console.log( 'areas: ' + cloud.areas.flatMap( area => area.name ) )
	console.log( 'team: ' + cloud.areas[0].teams[0].name )
	console.log( 'grand.parent: ' + cloud.areas[0].teams[0].area.cloud.name )
	console.log( '-----------------------------------------------' )
	console.log( util.inspect( cloud ) )
	console.log( '-----------------------------------------------' )
	console.log( util.inspect( cloud.areas[0] ) )
	console.log( '-----------------------------------------------' )
	console.log( util.inspect( cloud.areas[0].teams[0] ) )
	console.log( '\n*********************************************' )

}

const EC = new Cloud( config.clouds['engagement'] )

console.log( 'lookup by key: ' + EC.area('automation').team('segmentation-experience').name )