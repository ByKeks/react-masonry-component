var isBrowser = (typeof window !== 'undefined');
var Masonry = isBrowser ? window.Masonry || require('masonry') : null;
var Isotope = isBrowser ? window.Isotope || require('isotope-layout') : null;
var imagesloaded = isBrowser ? require('imagesloaded') : null;
var refName = 'masonryContainer';

function MasonryComponent(React) {
    return React.createClass({
        iso: false,

        domChildren: [],

        displayName: 'MasonryComponent',

        propTypes: {
            disableImagesLoaded: React.PropTypes.bool,
            options: React.PropTypes.object
        },

        getDefaultProps: function() {
            return {
                disableImagesLoaded: false,
                options: {},
                className: '',
                elementType: 'div'
            };
        },

        initializeMasonry: function(force) {
            if (!this.iso || force) {
                this.iso = new Isotope(
                  this.refs[refName],
                  this.props.options
                );

                this.domChildren = this.getNewDomChildren();
            }
        },

        getNewDomChildren: function() {
            var node = this.refs[refName];
            var children = this.props.options.itemSelector ? node.querySelectorAll(this.props.options.itemSelector) : node.children;
            return Array.prototype.slice.call(children);
        },

        diffDomChildren: function() {
            var oldChildren = this.domChildren.filter(function(element) {
                /*
                 * take only elements attached to DOM
                 * (aka the parent is the masonry container, not null)
                 */
                return !!element.parentNode;
            });

            var newChildren = this.getNewDomChildren();

            var removed = oldChildren.filter(function(oldChild) {
                return !~newChildren.indexOf(oldChild);
            });

            var domDiff = newChildren.filter(function(newChild) {
                return !~oldChildren.indexOf(newChild);
            });

            var beginningIndex = 0;

            // get everything added to the beginning of the DOMNode list
            var prepended = domDiff.filter(function(newChild, i) {
                var prepend = (beginningIndex === newChildren.indexOf(newChild));

                if (prepend) {
                    // increase the index
                    beginningIndex++;
                }

                return prepend;
            });

            // we assume that everything else is appended
            var appended = domDiff.filter(function(el) {
                return prepended.indexOf(el) === -1;
            });

            /*
             * otherwise we reverse it because so we're going through the list picking off the items that
             * have been added at the end of the list. this complex logic is preserved in case it needs to be
             * invoked
             *
             * var endingIndex = newChildren.length - 1;
             *
             * domDiff.reverse().filter(function(newChild, i){
             *     var append = endingIndex == newChildren.indexOf(newChild);
             *
             *     if (append) {
             *         endingIndex--;
             *     }
             *
             *     return append;
             * });
             */

            // get everything added to the end of the DOMNode list
            var moved = [];

            if (removed.length === 0) {
                moved = oldChildren.filter(function(child, index) {
                    return index !== newChildren.indexOf(child);
                });
            }

            this.domChildren = newChildren;

            return {
                old: oldChildren,
                new: newChildren,
                removed: removed,
                appended: appended,
                prepended: prepended,
                moved: moved
            };
        },

        performLayout: function() {
            var diff = this.diffDomChildren();

            if (diff.removed.length > 0) {
                this.iso.remove(diff.removed);
                this.iso.reloadItems();
            }

            if (diff.appended.length > 0) {
                this.iso.appended(diff.appended);
                this.iso.reloadItems();
            }

            if (diff.prepended.length > 0) {
                this.iso.prepended(diff.prepended);
            }

            if (diff.moved.length > 0) {
                this.iso.reloadItems();
            }

            this.iso.arrange();
        },

        imagesLoaded: function() {
            if (this.props.disableImagesLoaded) return;

            imagesloaded(
              this.refs[refName],
              function(instance) {
                  this.iso.arrange();
              }.bind(this)
            );
        },

        componentDidMount: function() {
            this.initializeMasonry();
            this.imagesLoaded();
        },

        componentDidUpdate: function() {
            if(!this.isMounted()) {return;}
            this.performLayout();
            this.imagesLoaded();
        },

        componentWillReceiveProps: function() {
            this._timer = setTimeout(function() {
                this.iso.reloadItems();
                this.isMounted && this.isMounted() && this.forceUpdate();
            }.bind(this), 0);
        },

        componentWillUnmount: function() {
            clearTimeout(this._timer);
        },

        render: function() {
            return React.createElement(this.props.elementType, {
                className: this.props.className,
                ref: refName
            }, this.props.children);
        }
    })
}

module.exports = MasonryComponent;
