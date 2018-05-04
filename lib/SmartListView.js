import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ListView,
  ActivityIndicator,
  ProgressBarAndroid,
  ActivityIndicatorIOS,
  ViewPropTypes,
  Platform
} from 'react-native';
import PullToRefreshListView from 'react-native-smart-pull-to-refresh-listview';
import SmartSwipeRow from './SmartSwipeRow';

class SmartListView extends PureComponent {
  constructor(props) {
    super(props);
    this._rows = {};
    this._openCellId = null;
    this._touching = false;

    this._dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
    });

    let dataList = this.props.data || []

    this.state = {
      first: true,
      dataList: dataList,
      dataSource: this._dataSource.cloneWithRows(dataList)
    }
  }

  componentDidMount() {
    if (this.props.data && this.props.data.length === 0)
      this._pullToRefreshListView.beginRefresh()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({
        dataList: nextProps.data,
        dataSource: this._dataSource.cloneWithRows(nextProps.data),
      })
    }

    if (this.props.refreshing !== nextProps.refreshing) {
      !nextProps.refreshing && this._pullToRefreshListView.endRefresh()
    }

    if (this.props.loadingMore !== nextProps.loadingMore) {
      !nextProps.loadingMore && this._pullToRefreshListView.endLoadMore(false)
    }
  }

  _renderRow = (item, sectionID, index) => {
    let {
      damping,
      tension,
      left,
      right,
      buttonWidth,
      style,
      rowContainerStyle,
      onPressRow,
      renderSeparator,
      ...otherProps
    } = this.props;

    return (
      <SmartSwipeRow
        {...otherProps}
        damping={damping}
        tension={tension}
        left={left.length > 0 ? left.map(l => l.onPress ? { ...l, onPress: () => l.onPress(item) } : l) : left}
        right={right.length > 0 ? right.map(r => r.onPress ? { ...r, onPress: () => r.onPress(item) } : l) : right}
        buttonWidth={buttonWidth}
        style={style}
        rowContainerStyle={rowContainerStyle}
        onPressRow={onPressRow ? () => onPressRow(item) : undefined}
        renderSeparator={renderSeparator}
        ref={row => (this._rows[`smartSwipe${index}`] = row)}
        onDrag={this._onDrag.bind(this, index)}
      >
        {this.props.renderRow && this.props.renderRow(item, index)}
      </SmartSwipeRow>
    )
  }

  _renderHeader = (viewState) => {
    let { pullState, pullDistancePercent } = viewState
    let { refresh_none, refresh_idle, will_refresh, refreshing, } = PullToRefreshListView.constants.viewState
    pullDistancePercent = Math.round(pullDistancePercent * 100)

    if (this.props.renderHeader) {
      this.props.renderHeader(viewState, PullToRefreshListView.constants.viewState)
      return
    }

    let { textRefreshNone, textRefreshIdle, textWillRefresh, textRefreshing, styleRefreshNone, styleRefreshIdle, styleWillRefresh, styleRefreshing } = this.props;
    switch (pullState) {
      case refresh_none:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleRefreshNone]}>
            <Text>{textRefreshNone}</Text>
          </View>
        )
      case refresh_idle:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleRefreshIdle]}>
            <Text>{`${textRefreshIdle} ${pullDistancePercent}%`}</Text>
          </View>
        )
      case will_refresh:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleWillRefresh]}>
            <Text>{`${textWillRefresh} ${pullDistancePercent > 100 ? 100 : pullDistancePercent}%`}</Text>
          </View>
        )
      case refreshing:
        return (
          <View style={[{ flexDirection: 'row', height: 35, justifyContent: 'center', alignItems: 'center' }, styleRefreshing]}>
            {this._renderActivityIndicator()}<Text>{textRefreshing}</Text>
          </View>
        )
    }
  }

  _renderFooter = (viewState) => {
    let { pullState, pullDistancePercent } = viewState
    let { load_more_none, load_more_idle, will_load_more, loading_more, loaded_all, } = PullToRefreshListView.constants.viewState
    pullDistancePercent = Math.round(pullDistancePercent * 100)
    if (this.props.renderFooter) {
      this.props.renderFooter(viewState, PullToRefreshListView.constants.viewState)

      return
    }

    let { textLoadMoreNone, textLoadMoreIdle, textWillLoadMore, textLoadingMore, textLoadedAll, styleLoadMoreNone, styleLoadMoreIdle, styleWillLoadMore, styleLoadingMore, styleLoadedAll } = this.props;
    switch (pullState) {
      case load_more_none:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleLoadMoreNone]}>
            <Text>{textLoadMoreNone}</Text>
          </View>
        )
      case load_more_idle:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleLoadMoreIdle]}>
            <Text>{`${textLoadMoreIdle} ${pullDistancePercent}%`}</Text>
          </View>
        )
      case will_load_more:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleWillLoadMore]}>
            <Text>{`${textWillLoadMore} ${pullDistancePercent > 100 ? 100 : pullDistancePercent}%`}</Text>
          </View>
        )
      case loading_more:
        return (
          <View style={[{ flexDirection: 'row', height: 35, justifyContent: 'center', alignItems: 'center' }, styleLoadingMore]}>
            {this._renderActivityIndicator()}<Text>{textLoadingMore}</Text>
          </View>
        )
      case loaded_all:
        return (
          <View style={[{ height: 35, justifyContent: 'center', alignItems: 'center' }, styleLoadedAll]}>
            <Text>{textLoadedAll}</Text>
          </View>
        )
    }
  }

  _renderActivityIndicator() {
    if (this.props.renderIndicator) {
      this.props.renderIndicator()

      return
    }

    return ActivityIndicator ? (
      <ActivityIndicator
        style={[{ marginRight: 10 }, this.props.styleIndicator]}
        animating={true}
        color={this.props.colorIndicator}
        size={this.props.sizeIndicator} />
    ) : Platform.OS == 'android' ?
        (
          <ProgressBarAndroid
            style={[{ marginRight: 10 }, this.props.styleIndicator]}
            color={this.props.colorIndicator}
            styleAttr={this.props.sizeIndicator} />
        ) : (
          <ActivityIndicatorIOS
            style={[{ marginRight: 10 }, this.props.styleIndicator]}
            animating={true}
            color={this.props.colorIndicator}
            size={this.props.sizeIndicator} />
        )
  }

  render() {
    let {
      pullUpDistance,
      pullUpStayDistance,
      pullDownDistance,
      pullDownStayDistance,
      initialListSize,
      enableEmptySections,
      pageSize,
      onRefresh,
      onLoadMore,
      contentContainerStyle,
      styleListView,
      enabledPullUp,
      enabledPullDown
    } = this.props;

    return (
      <PullToRefreshListView
        ref={(component) => this._pullToRefreshListView = component}
        viewType={PullToRefreshListView.constants.viewType.listView}
        contentContainerStyle={contentContainerStyle}
        style={styleListView}
        initialListSize={initialListSize}
        enableEmptySections={enableEmptySections}
        dataSource={this.state.dataSource}
        pageSize={pageSize}
        renderRow={this._renderRow}
        renderHeader={this._renderHeader}
        renderFooter={this._renderFooter}
        onRefresh={onRefresh}
        onLoadMore={onLoadMore}
        pullUpDistance={pullUpDistance}
        pullUpStayDistance={pullUpStayDistance}
        pullDownDistance={pullDownDistance}
        pullDownStayDistance={pullDownStayDistance}
        enabledPullUp={enabledPullUp}
        enabledPullDown={enabledPullDown}
        onScroll={e => this.onScroll(e)}
      />
    )

  }

  closeRow() {
    if (this._rows[this._openCellId].row) {
      this._rows[this._openCellId].row.snapTo({ index: 1 });
    }
  }

  _onDrag(index) {
    if (this._openCellId == null) {
      this._openCellId = `smartSwipe${index}`
    } else {
      if (this._openCellId && this._openCellId !== `smartSwipe${index}`) {
        this.closeRow()
        this._openCellId = `smartSwipe${index}`
      }
    }
  }

  onScroll({ nativeEvent }) {
    if (this._openCellId) {
      this.props.autoClose && this.closeRow();
      this._openCellId = null;
    }
  }  
}

SmartFlatlist.defaultProps = {
  damping: 0.3,
  tension: 300,
  data: [],
  left: [],
  right: [],
  buttonWidth: 75,
  onPressRow: null,
  style: {},
  rowContainerStyle: {},
  autoClose: true,
  renderSeparator: null,
  onRefresh: null,
  refreshing: false,
  loadingMore: false,
  pullUpDistance: 35,
  pullUpStayDistance: 50,
  pullDownDistance: 35,
  pullDownStayDistance: 50,
  pageSize: 20,
  initialListSize: 20,
  enableEmptySections: true,
  enabledPullUp: true,
  enabledPullDown: true,
  // Props render header
  renderHeader: undefined,
  styleRefreshNone: undefined,
  styleRefreshIdle: undefined,
  styleWillRefresh: undefined,
  styleRefreshing: undefined,
  textRefreshNone: "pull down to refresh",
  textRefreshIdle: "pull down to refresh",
  textWillRefresh: "release to refresh",
  textRefreshing: "refreshing",
  // Props render footer
  renderFooter: undefined,
  styleLoadMoreNone: undefined,
  styleLoadMoreIdle: undefined,
  styleWillLoadMore: undefined,
  styleLoadingMore: undefined,
  styleLoadedAll: undefined,
  textLoadMoreNone: "pull up to load more",
  textLoadMoreIdle: "pull up to load more",
  textWillLoadMore: "release to load more",
  textLoadingMore: "loading",
  textLoadedAll: "no more",
  // Props render Indicator
  renderIndicator: undefined,
  colorIndicator: "#ff0000",
  sizeIndicator: "small",
  styleIndicator: undefined
}

SmartFlatlist.propTypes = {
  damping: PropTypes.number,
  tension: PropTypes.number,
  data: PropTypes.array,
  contentContainerStyle: ViewPropTypes.style,
  numColumns: PropTypes.number,
  renderRow: PropTypes.func,
  left: PropTypes.arrayOf(PropTypes.shape({
    component: PropTypes.func,
    onPress: PropTypes.func,
    backgroundColor: PropTypes.string,
    styleButton: ViewPropTypes.style
  })),
  right: PropTypes.arrayOf(PropTypes.shape({
    component: PropTypes.func,
    onPress: PropTypes.func,
    backgroundColor: PropTypes.string,
    styleButton: ViewPropTypes.style
  })),
  onDrag: PropTypes.func,
  onSnap: PropTypes.func,
  buttonWidth: PropTypes.number,
  onPressRow: PropTypes.func,
  style: ViewPropTypes.style,
  rowContainerStyle: ViewPropTypes.style,
  autoClose: PropTypes.bool,
  renderSeparator: PropTypes.func,
  heightRow: PropTypes.number,
  onRefresh: PropTypes.func,
  onLoadMore: PropTypes.func,
  refreshing: PropTypes.bool,
  loadingMore: PropTypes.bool,
  pullUpDistance: PropTypes.number,
  pullUpStayDistance: PropTypes.number,
  pullDownDistance: PropTypes.number,
  pullDownStayDistance: PropTypes.number,
  pageSize: PropTypes.number,
  initialListSize: PropTypes.number,
  enableEmptySections: PropTypes.bool,
  enabledPullUp: PropTypes.bool,
  enabledPullDown: PropTypes.bool,
  // Props render header
  renderHeader: PropTypes.func,
  styleRefreshNone: ViewPropTypes.style,
  styleRefreshIdle: ViewPropTypes.style,
  styleWillRefresh: ViewPropTypes.style,
  styleRefreshing: ViewPropTypes.style,
  textRefreshNone: PropTypes.string,
  textRefreshIdle: PropTypes.string,
  textWillRefresh: PropTypes.string,
  textRefreshing: PropTypes.string,
  // Props render footer
  renderFooter: PropTypes.func,
  styleLoadMoreNone: ViewPropTypes.style,
  styleLoadMoreIdle: ViewPropTypes.style,
  styleWillLoadMore: ViewPropTypes.style,
  styleLoadingMore: ViewPropTypes.style,
  styleLoadedAll: ViewPropTypes.style,
  textLoadMoreNone: PropTypes.string,
  textLoadMoreIdle: PropTypes.string,
  textWillLoadMore: PropTypes.string,
  textLoadingMore: PropTypes.string,
  textLoadedAll: PropTypes.string,
  // Props render Indicator
  renderIndicator: PropTypes.func,
  colorIndicator: PropTypes.string,
  sizeIndicator: PropTypes.oneOf(["small", "large"]),
  styleIndicator: ViewPropTypes.style
}

export default SmartListView;
