var bootState = {
    preload: function() {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.load.image(PRELOAD_BAR_BACKGROUND, 'assets/images/loading_background.png')
        this.load.image(PRELOAD_BAR, 'assets/images/loading_bar.png');
    },
    create: function() {
        game.state.start('load');
    }
}