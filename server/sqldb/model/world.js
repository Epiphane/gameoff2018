'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('world', {
        _id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        seed: DataTypes.INTEGER,
        tiles: DataTypes.ARRAY(DataTypes.INTEGER),
        occupants: DataTypes.ARRAY(DataTypes.INTEGER),
        elevation: DataTypes.ARRAY(DataTypes.INTEGER),
        moisture: DataTypes.ARRAY(DataTypes.INTEGER),
        width: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        height: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        score: {
           type: DataTypes.INTEGER,
           defaultValue: 0
        }
    }, {
      instanceMethods: {
        toJSON: function () {
          var values = Object.assign({}, this.get());

          delete values._id;
          return values;
        },

        performUpdates: function(updates) {
            var self = this;

            var updateSql = [];
            var updateReplacements = [];
            updates.forEach((update) => {
                switch (update[0]) {
                case 0: // tile
                    updateSql.push('tiles[?] = ?');
                    this.tiles[update[1]] = update[2];
                    break;
                case 1: // occupant
                    updateSql.push('occupants[?] = ?');
                    this.occupants[update[1]] = update[2];
                    break;
                }
                updateReplacements.push(update[1] + 1, update[2])
            });

            updateReplacements.push(this._id);
            return sequelize.query('UPDATE worlds SET ' + updateSql.join(',') + ' WHERE _id = ?', {
                replacements: updateReplacements
            }).then(() => {
                return updates;
            });
        },

        setTiles: function(indices, value) {
            return this.performUpdates(indices.map((index) => {
                return [0, index, value];
            }));

            return Promise.resolve().then(() => {
                if (this.tiles[index] === value)
                    return [index, value];

                this.tiles[index] = value;

                // Don't wait on the query
                sequelize.query('UPDATE worlds SET tiles[?] = ? WHERE _id = ?', {
                    replacements: [index + 1, value, this._id]
                });
                return [0 /* tile */, index, value];
            });
        },

        setOccupants: function(indices, value) {
            return this.performUpdates(indices.map((index) => {
                return [1, index, value];
            }));

            return Promise.resolve().then(() => {
                if (this.occupants[index] === value)
                    return [index, value];

                this.occupants[index] = value;

                // Don't wait on the query
                sequelize.query('UPDATE worlds SET occupants[?] = ? WHERE _id = ?', {
                    replacements: [index + 1, value, this._id]
                });
                return [1 /* occupant */, index, value];
            });
        }
      }
    });
};
