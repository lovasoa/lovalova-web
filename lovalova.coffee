### lovalova.coffee
@author: Ophir LOJKINE (lovasoa)
@license: GPLv3
@description: small game in which you are a small square that has to avoid long rectangles
###

conf =
	world:
		acceleration: 2000 # pixels / s^2
		skin_friction: 0.005 # acceleration / speed^2 (pixels^-1)
		dry_friction: 2 # acceleration (pixels / s^2)
		bgcolor: [0,0,0]
	hero:
		size: [20,20]
		color: [122,122,198]

class Score
	constructor: ->
		@current = @best = 0
	update : (newscore) ->
		@current = parseInt(newscore) or 0
		@best = Math.max @current, @best
	save : -> localStorage.setItem 'lovalova.score.best', @best
	load : ->
		oldbest = 0|localStorage.getItem 'lovalova.score.best'
		@best = Math.max oldbest,@best

class Rectangle
	constructor: (@pos, @size) ->
	collision: (r) ->
		@pos[0] + @size[0] > r.pos[0] and
		@pos[0] < r.pos[0] + r.size[0] and
		@pos[1] + @size[1] > r.pos[1] and
		@pos[1] < r.pos[1] + r.size[1]

class AnimatedRectangle extends Rectangle
	constructor: ->
		@speed = [0,0]
		super
	animate: (dt) ->
		@pos[0] += @speed[0]*dt
		@pos[1] += @speed[1]*dt
	impulse: (accel, dt) ->
		@speed[0] += accel[0]*dt
		@speed[1] += accel[1]*dt

class LinkedList
	# Just an array in which you can remove elements in O(1)
	constructor: () ->
		@first = null
		@last = null
	append: (val) ->
		@last = {value:val, prev:@last, next:null}
		@last.prev.next = @last if @last.prev isnt null
		@first = @first or @last
	remove: (e) ->
		e.next.prev = e.prev if e.next != null
		e.prev.next = e.next if e.prev != null
		@last = @last.prev if e == @last
		@first = @first.next if e==@first
	forEach: (func) ->
		cur = @first
		while cur != null
			func cur.value, cur
			cur = cur.next

class Font
	constructor: (@height, @name) ->
	toString: -> "#{@height}px #{@name}"


class GameUI
	constructor: (@game, @canvas) ->
		@refreshsize()
		@ctx = @canvas.getContext '2d'
		@font = new Font 14, 'sans-serif'
	drawRect: (rect, color=[0,0,0], fill) ->
		mode = if fill then 'fill' else 'stroke'
		@ctx[mode+'Style'] = "rgb(#{color[0]},#{color[1]},#{color[2]})"
		@ctx[mode+'Rect'] rect.pos[0], rect.pos[1], rect.size[0], rect.size[1]
	writeText: (txt, pos, color=[255,255,255], font=@font) ->
		@ctx.fillStyle = "rgba(#{color[0]},#{color[1]},#{color[2]},1)"
		@ctx.font = font.toString()
		@ctx.fillText txt, pos[0], pos[1]+font.height
	draw: (running) ->
		# Draw the background
		@drawRect @screenRect,conf.world.bgcolor,yes
		# Write the score
		@writeText "Score: #{@game.score.current} | Best : #{@game.score.best}", [0, 0]
		if @game.loose
			@writeText 'You loose! Press space to try again', [100, 100]
			return

		@drawRect @game.hero, conf.hero.color, yes
		@game.ennemies.forEach (enn) =>
			@drawRect enn, [0|enn.speed[0]*255/150, 0|enn.speed[1]*255/150, 255], no
		if running isnt true
			@writeText 'Game paused. Press p to resume.', [100, 100]

	refreshsize: ->
		@screenRect = new Rectangle [0,0], [@canvas.width,@canvas.height]

class Game
	constructor: (@screen) ->
		@score = new Score
		@score.load()
		@ennemies = new LinkedList
		@loose = false
		@hero = new AnimatedRectangle (x/2 for x in @screen), conf.hero.size
		@timeStarted = Date.now()

	update: (dt) ->
		if @loose then return

		@score.update (Date.now() - @timeStarted)/1000

		# Move the hero
		directions = [['left','right'],['up', 'down']]
		impulsion = [0,0]
		for i in [0..1]
			dirfriction = if @hero.speed[i] > 0 then -1 else 1
			impulsion[i] += dirfriction * conf.world.skin_friction * @hero.speed[i]**2
			impulsion[i] -= conf.world.dry_friction*@hero.speed[i]

			if @hero.pos[i] > @screen[i] - @hero.size[i]
				@hero.pos[i] = @screen[i] - @hero.size[i]
				@hero.speed[i] *= -1

			if @hero.pos[i] < 0
				@hero.pos[i] = 0
				@hero.speed[i] *= -1

			for j in [0..1]
				if keyboard.isCharCodeDown keyboard.charCodes[directions[i][j]]
					accel = (2*j-1)*conf.world.acceleration
					impulsion[i] += accel
		# Friction
		@hero.impulse impulsion, dt
		@hero.animate dt

		# Create ennemies
		if Math.random() < 0.02 + 0.01*Math.sqrt(@score.current)
			horiz = Math.random() > 0.5
			newenn = new AnimatedRectangle [0,0], [3,3]
			for n in [0..1]
				if horiz == (n==0)
					newenn.pos[n] = Math.random()*@screen[n]
					newenn.size[n] = 20 + Math.random()*100
					newenn.speed[1-n] = 50 + Math.random()*100
			@ennemies.append newenn
		# Move the ennemies
		@ennemies.forEach (e, node) =>
			e.animate(dt)
			if e.pos[0] > @screen[0] or e.pos[1] > @screen[1]
				@ennemies.remove node
			if e.collision @hero
				@end()

	end: ->
		@loose = true
		@score.save()

class GameManager
	constructor: (@canvas) ->
		@game = new Game [@canvas.width, @canvas.height]
		@gameui = new GameUI @game, @canvas
		@running = true
		document.body.addEventListener 'keydown', (e) =>
			switch String.fromCharCode(e.keyCode)
				when ' '
					@game.constructor [@canvas.width, @canvas.height]
					@gameui.draw()
				when 'P'
					@running = not @running
					@lastTime = null
					requestAnimationFrame @animate
		window.onblur = => @running = no

		requestAnimationFrame @animate
	animate: (curTime) =>
		@lastTime = curTime if not @lastTime?
		dt = (curTime - @lastTime)/1000
		@lastTime = curTime
		@game.update dt
		@gameui.draw @running
		if @running
			requestAnimationFrame @animate

keyboard =
	pressed : {}
	charCodes :
		left  : String.fromCharCode(37)
		up    : String.fromCharCode(38)
		right : String.fromCharCode(39)
		down  : String.fromCharCode(40)
		ctrl  : String.fromCharCode(17)
		alt  : String.fromCharCode(18)
		tab   : String.fromCharCode(9)
		enter : String.fromCharCode(13)
	isCharCodeDown : (key) -> @pressed[key] == true
	isLetterDown   : (letter) -> @isCharCodeDown(letter.charCodeAt(0))

window.onkeydown = (e) ->
	keyboard.pressed[String.fromCharCode (e.keyCode or e.key)] = true
	e.preventDefault()
window.onkeyup   = (e) ->
	e.preventDefault()
	keyboard.pressed[String.fromCharCode (e.keyCode or e.key)] = false

requestAnimationFrame = window.requestAnimationFrame or
												window.mozRequestAnimationFrame or
												window.webkitRequestAnimationFrame or
												(fun) -> setTimeout fun, 10, Date.now()+10

window.GameManager = GameManager
