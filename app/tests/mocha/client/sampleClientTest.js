if (!(typeof MochaWeb === 'undefined')) {
    MochaWeb.testOnly(function() {
        describe("text editor", function() {
            it("should change data-main-text's font-weight to bold when bold button is clicked", function() {
                $('[data-change-font-type="bold"]').trigger('click');
                var fontWeight = $('[data-main-text]').css('font-weight');
                chai.assert.equal(fontWeight, 'bold');
            });

            it("should change data-main-text's font-style to italic when italic button is clicked", function() {
                $('[data-change-font-type="italic"]').trigger('click');
                var fontStyle = $('[data-main-text]').css('font-style');
                chai.assert.equal(fontStyle, 'italic');
            });

            it("should add text-shadow to data-main-text when shadow button is clicked", function() {
                $('[data-change-font-type="shadow"]').trigger('click');
                var textShadow = $('[data-main-text]').css('text-shadow');
                chai.assert.equal(textShadow, 'none');
            });

            it("should have text-shadow added to data-main-text from the beginning", function() {
                var textShadow = $('[data-main-text]').css('text-shadow');
                chai.assert.equal(textShadow, 'none');
            });
        });
    });
}
