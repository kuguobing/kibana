define(function (require) {
  var _ = require('lodash');

  var html = require('text!components/doc_table/doc_table.html');
  var getSort = require('components/doc_table/lib/get_sort');

  require('css!components/doc_table/doc_table.css');
  require('directives/truncated');
  require('components/doc_table/components/table_header');
  require('components/doc_table/components/table_row');

  require('modules').get('kibana')
  .directive('docTable', function (config, Notifier) {
    return {
      restrict: 'E',
      template: html,
      scope: {
        searchSource: '=',
        sorting: '=',
        columns: '=',
        infiniteScroll: '=?',
        filter: '=?',
      },
      link: function ($scope) {
        var notify = new Notifier();

        $scope.persist = {
          sorting: $scope.sorting,
          columns: $scope.columns
        };

        var prereq = (function () {
          var fns = [];

          return function register(fn) {
            fns.push(fn);

            return function () {
              fn.apply(this, arguments);

              if (fns.length) {
                _.pull(fns, fn);
                if (!fns.length) {
                  $scope.$root.$broadcast('ready:vis');
                }
              }
            };
          };
        }());

        $scope.addRows = function () {
          $scope.limit += 50;
        };

        $scope.$on('$destroy', function () {
          if ($scope.searchSource) $scope.searchSource.destroy();
        });

        $scope.$watch('searchSource', prereq(function (searchSource) {
          if (!$scope.searchSource) return;

          $scope.indexPattern = $scope.searchSource.get('index');

          $scope.searchSource.size(config.get('discover:sampleSize'));
          $scope.searchSource.sort(getSort($scope.sorting, $scope.indexPattern));

          // Set the watcher after initialization
          $scope.$watch('persist.sorting', function (newSort, oldSort) {
            // Don't react if sort values didn't really change
            if (newSort === oldSort) return;
            $scope.searchSource.sort(getSort(newSort, $scope.indexPattern));
            $scope.searchSource.fetchQueued();
          });

          // TODO: we need to have some way to clean up result requests
          $scope.searchSource.onResults().then(function onResults(resp) {
            // Reset infinite scroll limit
            $scope.limit = 50;

            // Abort if something changed
            if ($scope.searchSource !== $scope.searchSource) return;

            $scope.hits = resp.hits.hits;

            return $scope.searchSource.onResults().then(onResults);
          }).catch(notify.fatal);

          $scope.searchSource.onError(notify.error).catch(notify.fatal);
        }));

      }
    };
  });
});