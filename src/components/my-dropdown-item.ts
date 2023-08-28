import { html } from "lit";
import { query, property, customElement } from "lit/decorators.js";
import BaseElement from "../base/base-element";
import styles from "./my-dropdown-item.scss";

@customElement("my-dropdown-item")
export class MyDropdownItem extends BaseElement {
  static styles = [BaseElement.styles, styles];

  /**@internal */
  @query("a")
  private anchor: HTMLElement;

  /** when true, sets the active stylings of .nav-link */
  @property({ type: Boolean })
  active = false;

  /** Href attribute for anchor element in SgdsMainnavItem */
  @property({ type: String })
  href = "";

  /** Disables the SgdsMainnavItem */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Where to display the linked URL, as the name for a browsing context. Forwards to the HTMLAnchor target attribute */
  @property({ type: String, reflect: true })
  target: "_blank" | "_parent" | "_self" | "_top" = "_self";

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        this.anchor.click();
      }
    });
  }

  render() {
    return html`
      <li>
        <a
          href="${this.href}"
          class="dropdown-item"
          ?disabled=${this.disabled}
          aria-disabled=${this.disabled ? "true" : "false"}
          role="menuitem"
          tabindex=${this.disabled ? "-1" : "0"}
          target=${this.target}
          ><slot></slot
        ></a>
      </li>
    `;
  }
}

export default MyDropdownItem;
