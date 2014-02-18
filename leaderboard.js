Hashes = new Meteor.Collection("hashes");

Router.map(function() {
    this.route('home', {path: '/'});
    this.route('hash_view', {
        path: '/file/:slug',
        data: function () {
            console.log("looking for hash: " + this.params.slug);
            h = Hashes.findOne({ hash: this.params.slug });
            console.log(h);
            if (h) {
                // for some reason {{hash}} was undefined in the template.
                h["file_hash"] = h["hash"];
                return h;
            }
        }
    });
})

if (Meteor.isClient) {
    Template.pleases_leaderboard.hashes = function () {
        return Hashes.find({}, {limit: 20, sort: {pleases: -1, hash: 1}});
    };

    Template.upsets_leaderboard.hashes = function () {
        return Hashes.find({}, {limit: 20, sort: {upsets: -1, hash: 1}});
    };

    function submitHash (template, upsets, pleases) {
        hash = template.find("input[name=hash]")

        Meteor.call("addHash", hash.value, upsets, pleases, function (error) {
            if (!error) {
                console.log("Added (hash, pleases, upsets): "
                    + "(" + hash.value + ", " + pleases + ", " + upsets + ")");
                hash.value = ""
            } else {
                console.log("Didn't add anything.");
            }
        });
    }

    Template.submit_hash.events({
        'click #upsets' : function(event, template) { submitHash(template, 1, 0); },
        'click #pleases': function(event, template) { submitHash(template, 0, 1); },
    });
}

if (Meteor.isServer) {
    Meteor.methods({
        addHash : function (hash, upsets, pleases) {
            var re = /[a-fA-F0-9]{64}/;

            // ignore non-sha256 strings.
            if (!re.test(hash)) {
                console.log("rejected hash: " + hash);
                return true;
            }

            console.log("Considering a hash: " + hash)
            var thing = Hashes.findOne( {"hash": hash } );
            if (thing) {
                console.log("Updating it (upsets, pleases): (" + upsets + ", " + pleases + ")")
                Hashes.update(thing, { $inc: { upsets: upsets, pleases: pleases } });
            } else {
                console.log("Adding it (upsets, pleases): (" + upsets + ", " + pleases + ")")
                Hashes.insert({ hash: hash, upsets: upsets, pleases: pleases });
            }

            return false;
        },

        findHash: function (hash) {
            return Hashes.findOne({ hash: hash });
        }
    });

    Meteor.startup(function () {
        if (Hashes.find().count() === 0) {
            // initial hashes that please us.
            var hashes = ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            ];
            for (var i = 0; i < hashes.length; i++) {
                Hashes.insert({hash: hashes[i], upsets: 0, pleases: 1});
            }
        }
    });
}
