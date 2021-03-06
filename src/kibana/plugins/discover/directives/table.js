define(function (require) {
  var html = require('text!plugins/discover/partials/table.html');

  require('directives/truncated');
  require('directives/infinite_scroll');
  require('components/doc_table/components/table_header');
  require('components/doc_table/components/table_row');

  var module = require('modules').get('app/discover');

  /**
   * kbnTable directive
   *
   * displays results in a simple table view. Pass the result object
   * via the results attribute on the kbnTable element:
   * ```
   * <kbn-table columns="columnsToDisplay" rows="rowsToDisplay"></kbn-table>
   * ```
   */
  module.directive('kbnTable', function (config) {
    return {
      restrict: 'E',
      template: html,
      scope: {
        columns: '=',
        rows: '=',
        sorting: '=',
        filtering: '=',
        refresh: '=',
        indexPattern: '=',
      },
      link: function ($scope, $el) {
        $scope.limit = 50;
        $scope.addRows = function () {
          if ($scope.limit < config.get('discover:sampleSize')) {
            $scope.limit = $scope.limit + 50;
          }
        };
      }
    };
  });

});
