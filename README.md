# Ludum Dare 38 - Grub ... ?

I guess we're calling it Grub. It's a fun game go play it at http://ld38.herokuapp.com.

## Adding content (since I'll be at work)

There are four ways you might want to add content:

### New Actions

  See the comments in `server/controller/action.js` and `public/js/components/ui.js`, they'll tell you what to do.

### New Occupants

  See the comments in `server/occupants.js`, it'll tell you what to do

### New Tiles

  See the comments in `server/tiles.js`, it'll tell you what to do

### Changing NatureBot

This is a fun one but I didn't write comments cause I figured we could revisit this one later. 

Tl;dr NatureBot is a collection of Components, each one allowed to set itself up (`init`) and update once every 250ms (`tick`). For a super simple implementation, reference `nature_bot/components/RandoComponent.js`

Adding components is easy (even multiple!). Just change `nature_box/config.js` and add an entry for your component. Any extra params you include besides name are applied as a parameter to the constructor.

```
components: [ { name: 'MyComponent', foo: 'bar' } ]

calls

new MyComponent({ name: 'MyComponent', foo: 'bar' });
```

If you want to change production stuff (like send map updates), you'll need to provide an `ELEVATE_SECRET` token in `server/config/local.env.js`. I know what the secret is :)
