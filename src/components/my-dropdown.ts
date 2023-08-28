import type { StrictModifiers } from "@popperjs/core";
import * as Popper from "@popperjs/core";
import { Dropdown } from "bootstrap";
import { property, query, state } from "lit/decorators.js";
import { Ref, createRef } from "lit/directives/ref.js";
import { MyDropdownItem } from "./my-dropdown-item";
import BaseElement from "../base/base-element";
import styles from "./my-dropdown.scss";

const ARROW_DOWN = "ArrowDown";
const ARROW_UP = "ArrowUp";
const ESC = "Escape";
const ENTER = "Enter";

export type DropDirection = "left" | "right" | "up" | "down";

export class MyDropdown extends BaseElement {
  static styles = [BaseElement.styles, styles];
  /**@internal */
  @query("ul.dropdown-menu") menu: HTMLUListElement;
  /** @internal */
  myDropdown: Ref<HTMLElement> = createRef();
  /** @internal */
  bsDropdown: Dropdown = null;

  /** When true, dropdown menu shows on first load */
  @property({ type: Boolean, reflect: true })
  menuIsOpen = false;

  /** Controls the close behaviour of dropdown menu. By default menu auto-closes when MyDropdownItem or area outside dropdown is clicked */
  @property({ type: String })
  close: "outside" | "default" | "inside" = "default";

  /** Disables the dropdown toggle */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** @internal */
  @state()
  nextDropdownItemNo = 0;
  /** @internal */
  @state()
  prevDropdownItemNo = -1;
  /** @internal */
  @state()
  dropdownConfig: Partial<Popper.Options>;
  /** @internal */
  @state()
  modifierOpt: StrictModifiers[] = [
    {
      name: "offset",
      options: {
        offset: [0, 10],
      },
    },
  ];

  firstUpdated() {
    this.bsDropdown = new Dropdown(this.myDropdown.value, {
      reference: "toggle",
      popperConfig: (defaultConfig?: Partial<Popper.Options>) => {
        defaultConfig.placement = "bottom-start";
        defaultConfig.modifiers = this.modifierOpt;

        return defaultConfig;
      },
    });

    this.myDropdown.value.addEventListener("show.bs.dropdown", () => {
      this.menuIsOpen = true;
      this.emit("my-dropdown-show");
    });

    this.myDropdown.value.addEventListener("shown.bs.dropdown", () => {
      this.menuIsOpen = true;
      this.emit("my-dropdown-after-show");
    });

    this.myDropdown.value.addEventListener("hide.bs.dropdown", () => {
      this.menuIsOpen = false;
      this.emit("my-dropdown-hide");
    });

    this.myDropdown.value.addEventListener("hidden.bs.dropdown", () => {
      this.menuIsOpen = false;
      this.emit("my-dropdown-after-hide");
    });

    this.addEventListener("keydown", this._handleKeyboardEvent);
    if (this.close !== "inside") {
      this.addEventListener("blur", (e) => {
        // when clicking outside of the dropdown component, it becomes null, hide the dropdown
        return e.relatedTarget === null
          ? this.bsDropdown.hide()
          : e.stopPropagation();
      });
      addEventListener("click", (e) => this._handleClickOutOfElement(e, this));
    }
  }
  /** When invoked, opens the dropdown menu */
  public showMenu() {
    this.bsDropdown.show();
  }

  /** When invoked, hides the dropdown menu */
  public hideMenu() {
    this.bsDropdown.hide();
  }

  _onClickDropdownToggle() {
    this.bsDropdown.toggle();
  }

  _resetMenu() {
    this.nextDropdownItemNo = 0;
    this.prevDropdownItemNo = -1;
    // reset the tabindex
    const items = this._getMenuItems();
    items.forEach((i) => {
      i.removeAttribute("tabindex");
    });
  }
  _getMenuItems(): MyDropdownItem[] {
    // for case when default slot is used e.g. dropdown, mainnavdropdown
    if (this.shadowRoot.querySelector("slot#default")) {
      return (
        this.shadowRoot.querySelector("slot#default") as HTMLSlotElement
      )?.assignedElements({
        flatten: true,
      }) as MyDropdownItem[];
    }

    // for case when there is no slot e.g. combobox
    if (this.menu.hasChildNodes()) {
      const menuItems = this.menu.children;

      return [...menuItems] as MyDropdownItem[];
    }
  }

  _getActiveMenuItems(): MyDropdownItem[] {
    return this._getMenuItems().filter((item) => !item.disabled);
  }

  _setMenuItem(currentItemIdx: number, isArrowDown = true) {
    const items = this._getActiveMenuItems();
    if (items.length === 0) return;
    const item = items[currentItemIdx];
    this.nextDropdownItemNo = currentItemIdx + 1;
    this.prevDropdownItemNo =
      currentItemIdx - 1 < 0 ? items.length - 1 : currentItemIdx - 1;
    let activeItem: MyDropdownItem;
    if (item.disabled) {
      return this._setMenuItem(
        isArrowDown ? this.nextDropdownItemNo : this.prevDropdownItemNo
      );
    } else activeItem = item;

    // focus or blur items depending on active or not
    items.forEach((i) => {
      i.setAttribute("tabindex", i === activeItem ? "0" : "-1");
      i === activeItem && i.focus();
    });
  }

  _handleSelectSlot(e: KeyboardEvent | MouseEvent) {
    const items = this._getActiveMenuItems();
    const currentItemNo = items.indexOf(e.target as MyDropdownItem);
    this.nextDropdownItemNo = currentItemNo + 1;
    this.prevDropdownItemNo =
      currentItemNo <= 0 ? items.length - 1 : currentItemNo - 1;

    /** Emitted event from SgdsDropdown element when a slot item is selected */
    const selectedItem = e.target as MyDropdownItem;
    if (!selectedItem.disabled) {
      this.emit("sgds-select");
      this.close !== "outside" && this.bsDropdown.hide();
    } else return;
  }
  _handleKeyboardEvent(e: KeyboardEvent) {
    const menuItems = this._getActiveMenuItems();
    switch (e.key) {
      case ARROW_DOWN:
        e.preventDefault();
        if (!this.menuIsOpen) return this.bsDropdown.show();
        if (this.nextDropdownItemNo === menuItems.length) {
          return this._setMenuItem(0);
        } else {
          return this._setMenuItem(
            this.nextDropdownItemNo > 0 ? this.nextDropdownItemNo : 0
          );
        }
      case ARROW_UP:
        e.preventDefault();
        if (!this.menuIsOpen) return this.bsDropdown.show();
        if (this.prevDropdownItemNo < 0) {
          return this._setMenuItem(menuItems.length - 1, false);
        } else {
          return this._setMenuItem(this.prevDropdownItemNo, false);
        }
      case ESC:
        return this.bsDropdown.hide();
      case ENTER:
        if (menuItems.includes(e.target as MyDropdownItem)) {
          return this._handleSelectSlot(e);
        }
        break;
      default:
        break;
    }
  }

  _handleClickOutOfElement(e: MouseEvent, self: MyDropdown) {
    if (!e.composedPath().includes(self)) {
      this.bsDropdown.hide();
    }
  }
}
