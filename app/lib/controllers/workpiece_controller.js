WorkpieceController = RouteController.extend({
    subscriptions: function() {
        this.subscribe('workpiece', this.params._id).wait();
    },

    data: function() {
        return Workpieces.findOne({
            _id: this.params._id
        });
    },

    action: function() {
        this.render('Workpiece', { /* data: {} */ });
    }
});