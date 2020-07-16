import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { connect } from "react-redux";

import ConditionalRender from "../../ConditionalRender";
import { openChart } from "../../actions/charts";
import bu from "../backgroundUtils";
import Descriptions from "../menu-descriptions.json";
import DescribeOption from "./DescribeOption";
import InstancesOption from "./InstancesOption";
import LowVarianceOption from "./LowVarianceOption";
import RangeHighlightOption from "./RangeHighlightOption";
import { XArrayOption } from "./XArrayOption";
import menuFuncs from "./dataViewerMenuUtils";

class ReactDataViewerMenu extends React.Component {
  render() {
    const { hideShutdown, dataId, menuOpen, backgroundMode } = this.props;
    const iframe = global.top !== global.self;
    const buttonHandlers = menuFuncs.buildHotkeyHandlers(this.props);
    const { openTab, openPopup } = buttonHandlers;
    const refreshWidths = () =>
      this.props.propagateState({
        columns: _.map(this.props.columns, c => _.assignIn({}, c)),
      });
    const resizeBgs = ["outliers", "missing"];
    const bgState = bgType => ({
      backgroundMode: backgroundMode === bgType ? null : bgType,
      triggerBgResize: _.includes(resizeBgs, backgroundMode) || _.includes(resizeBgs, bgType),
    });
    const toggleBackground = bgType => () => this.props.propagateState(bgState(bgType));
    const toggleOutlierBackground = () => {
      const updatedState = bgState("outliers");
      if (updatedState.backgroundMode === "outliers") {
        updatedState.columns = _.map(this.props.columns, bu.buildOutlierScales);
      }
      this.props.propagateState(updatedState);
    };
    const heatmapActive = _.startsWith(backgroundMode, "heatmap");
    const exportFile = tsv => () =>
      window.open(
        `${menuFuncs.fullPath("/dtale/data-export", dataId)}?tsv=${tsv}&_id=${new Date().getTime()}`,
        "_blank"
      );
    const closeMenu = () => {
      $(document).unbind("click.gridActions");
      this.props.propagateState({ menuOpen: false });
    };
    return (
      <div
        className="column-toggle__dropdown"
        hidden={!menuOpen}
        style={{ minWidth: "11em", top: "1em", left: "0.5em" }}>
        {menuOpen && <GlobalHotKeys keyMap={{ CLOSE_MENU: "esc" }} handlers={{ CLOSE_MENU: closeMenu }} />}
        <header className="title-font">D-TALE</header>
        <ul>
          <XArrayOption columns={_.reject(this.props.columns, { name: "dtale_index" })} />
          <DescribeOption open={buttonHandlers.DESCRIBE} />
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={buttonHandlers.FILTER}>
                <i className="fa fa-filter ml-2 mr-4" />
                <span className="font-weight-bold">Custom Filter</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.filter}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={buttonHandlers.BUILD}>
                <i className="ico-build" />
                <span className="font-weight-bold">Build Column</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.build}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openPopup("reshape", 400, 770)}>
                <i className="fas fa-tools ml-2 mr-4" />
                <span className="font-weight-bold">Summarize Data</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.reshape}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={openTab("correlations")}>
                <i className="ico-bubble-chart" />
                <span className="font-weight-bold">Correlations</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.corr}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={buttonHandlers.CHARTS}>
                <i className="ico-show-chart" />
                <span className="font-weight-bold">Charts</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.charts}</div>
          </li>
          <li className="hoverable" style={{ color: "#565b68" }}>
            <span className="toggler-action">
              <i className={`fa fa-${heatmapActive ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
            </span>
            <span className={`font-weight-bold pl-2${heatmapActive ? "flames" : ""}`}>{"Heat Map"}</span>
            <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting" style={{ fontSize: "75%" }}>
              {_.map(
                [
                  ["By Col", "heatmap-col"],
                  ["Overall", "heatmap-all"],
                ],
                ([label, mode]) => (
                  <button
                    key={label}
                    style={{ color: "#565b68" }}
                    className="btn btn-primary font-weight-bold"
                    onClick={toggleBackground(mode)}>
                    {mode === backgroundMode && <span className="flames">{label}</span>}
                    {mode !== backgroundMode && label}
                  </button>
                )
              )}
            </div>
            <div className="hoverable__content menu-description">{Descriptions.heatmap}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={toggleBackground("dtypes")}>
                <div style={{ display: "inherit" }}>
                  <div className={`bg-icon dtype-bg${backgroundMode === "dtypes" ? " spin" : ""}`} />
                  <span className="font-weight-bold pl-4">Highlight Dtypes</span>
                </div>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.highlight_dtypes}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={toggleBackground("missing")}>
                <div style={{ display: "inherit" }}>
                  <div className={`bg-icon missing-bg${backgroundMode === "missing" ? " spin" : ""}`} />
                  <span className="font-weight-bold pl-4">Highlight Missing</span>
                </div>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.highlight_missings}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={toggleOutlierBackground}>
                <div style={{ display: "inherit" }}>
                  <div className={`bg-icon outliers-bg${backgroundMode === "outliers" ? " spin" : ""}`} />
                  <span className="font-weight-bold pl-4">Highlight Outliers</span>
                </div>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.highlight_outliers}</div>
          </li>
          <RangeHighlightOption {...this.props} />
          <LowVarianceOption
            toggleLowVarianceBackground={toggleBackground("lowVariance")}
            backgroundMode={backgroundMode}
          />
          <InstancesOption open={openPopup("instances", 450, 750)} />
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={buttonHandlers.CODE}>
                <i className="ico-code" />
                <span className="font-weight-bold">Code Export</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.code}</div>
          </li>
          <li className="hoverable" style={{ color: "#565b68" }}>
            <span className="toggler-action">
              <i className="far fa-file" />
            </span>
            <span className="font-weight-bold pl-2">Export</span>
            <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
              {_.map(
                [
                  ["CSV", "false"],
                  ["TSV", "true"],
                ],
                ([label, tsv]) => (
                  <button
                    key={label}
                    style={{ color: "#565b68" }}
                    className="btn btn-primary font-weight-bold"
                    onClick={exportFile(tsv)}>
                    {label}
                  </button>
                )
              )}
            </div>
            <div className="hoverable__content menu-description">{Descriptions.export}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button className="btn btn-plain" onClick={refreshWidths}>
                <i className="fas fa-columns ml-2 mr-4" />
                <span className="font-weight-bold">Refresh Widths</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.widths}</div>
          </li>
          <li className="hoverable">
            <span className="toggler-action">
              <button
                className="btn btn-plain"
                onClick={() =>
                  this.props.openChart({
                    type: "about",
                    size: "modal-sm",
                    backdrop: true,
                  })
                }>
                <i className="fa fa-info-circle la-lg mr-4 ml-1" />
                <span className="font-weight-bold">About</span>
              </button>
            </span>
            <div className="hoverable__content menu-description">{Descriptions.about}</div>
          </li>
          <ConditionalRender display={iframe}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => window.location.reload()}>
                  <i className="ico-sync" />
                  <span className="font-weight-bold">Reload Data</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={iframe}>
            <li>
              <span className="toggler-action">
                <button className="btn btn-plain" onClick={() => window.open(window.location.pathname, "_blank")}>
                  <i className="ico-open-in-new" />
                  <span className="font-weight-bold">Open In New Tab</span>
                </button>
              </span>
            </li>
          </ConditionalRender>
          <ConditionalRender display={hideShutdown == false}>
            <li className="hoverable">
              <span className="toggler-action">
                <a className="btn btn-plain" href="/shutdown">
                  <i className="fa fa-power-off ml-2 mr-4" />
                  <span className="font-weight-bold">Shutdown</span>
                </a>
              </span>
              <div className="hoverable__content menu-description">{Descriptions.shutdown}</div>
            </li>
          </ConditionalRender>
        </ul>
      </div>
    );
  }
}
ReactDataViewerMenu.displayName = "ReactDataViewerMenu";
ReactDataViewerMenu.propTypes = {
  columns: PropTypes.array,
  menuOpen: PropTypes.bool,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
  backgroundMode: PropTypes.string,
  rangeHighlight: PropTypes.object,
  hideShutdown: PropTypes.bool,
  dataId: PropTypes.string.isRequired,
};

const ReduxDataViewerMenu = connect(
  state => _.pick(state, ["dataId", "hideShutdown"]),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(ReactDataViewerMenu);

export { ReduxDataViewerMenu as DataViewerMenu, ReactDataViewerMenu };
