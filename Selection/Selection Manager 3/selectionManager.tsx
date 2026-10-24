"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./selectionManager.module.css";
import classNames from "classnames";
import TrashIcon from "@/app/ui/icons/trash";
import Button from "@/app/ui/Buttons/Button Set 1/button";
import Modal from "@/app/ui/Modals/Modal Versatile Portal/modal";
import LoaderCircle from "@/app/ui/Loaders/Circle Loader 1/loader";
import LoaderFullscreen from "@/app/ui/Loaders/Loader Fullscreen/loaderFullscreen";
import ConfirmationBox from "@/app/ui/Confirmation Box/confirmationBox";
import { useRouter } from "next/navigation";

/*
 *  id    - unique identifier, used to track which items to delete
 *  label - display text shown inside the item card
 *
 *  Add more fields to Item as needed for your project.
 */
export interface Item {
  id: string;
  label: string;
}

/*
 *  Placeholder card. Swap this out for your project's card component.
 *
 *  selecting - true while the delete menu is open. Useful if your card is a
 *              link: open it in a new tab so the user doesn't lose their selection.
 */
export function Item({ item, selecting }: { item: Item; selecting: boolean }) {
  return (
    <div className={styles.item} data-selecting={selecting}>
      {item.label}
    </div>
  );
}

/*
 *  itemsArr       - the items to display / manage
 *  headlineText?  - heading shown at the top of the manager
 *  headlineIcon?  - optional icon rendered before the heading text
 *  itemLabel?     - singular noun used in confirmation messages, e.g. "draft", "file", "photo"
 *  emptyMessage?  - message shown when there are no items
 *  selectionMode? - "multiple" (default) allows shift-click ranges and select all,
 *                   "single" only allows one item to be selected at a time
 */
interface SelectionManagerProps {
  itemsArr: Item[];
  headlineText?: string;
  headlineIcon?: React.ReactNode;
  itemLabel?: string;
  emptyMessage?: string;
  selectionMode?: "multiple" | "single";
}

export default function SelectionManager({
  itemsArr,
  headlineText = "Your Items",
  headlineIcon,
  itemLabel = "item",
  emptyMessage = "You don't have any items yet.",
  selectionMode = "multiple",
}: SelectionManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(itemsArr);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const confirmDeleteMessage = useRef("");

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastCheckboxChecked = useRef(0);

  const multiSelect = selectionMode === "multiple";

  // Keep local items in sync if the parent passes a new array
  useEffect(() => {
    setItems(itemsArr);
  }, [itemsArr]);

  // Drop stale refs when items are removed so .every / .some stay accurate
  useEffect(() => {
    checkboxRefs.current.length = items.length;
  }, [items]);

  // Escape closes the delete menu, Backspace triggers deletion of the selection
  useEffect(() => {
    if (showDeleteMenu) {
      window.addEventListener("keydown", handleKeydown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [showDeleteMenu, showDeleteButton]);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeDeleteMenu();
    } else if (e.key === "Backspace") {
      if (showDeleteButton) {
        confirmDeletion();
      }
    }
  }

  function openDeleteMenu() {
    lastCheckboxChecked.current = 0;
    setShowDeleteMenu(true);
  }

  function closeDeleteMenu() {
    setShowDeleteMenu(false);
    setShowDeleteButton(false);
  }

  function anyChecked() {
    return checkboxRefs.current.some((checkbox) => checkbox?.checked === true);
  }

  // Shared logic for click and keyboard toggling of an item's checkbox.
  // Handles single-select exclusivity, shift-click ranges and select-all syncing.
  function syncSelection(index: number, shiftKey: boolean) {
    const current = checkboxRefs.current[index];

    if (!multiSelect) {
      if (current?.checked) {
        checkboxRefs.current.forEach((checkbox, i) => {
          if (index !== i && checkbox) {
            checkbox.checked = false;
          }
        });
      }
      setShowDeleteButton(anyChecked());
      return;
    }

    if (shiftKey && current?.checked) {
      for (
        let i = Math.min(index, lastCheckboxChecked.current);
        i < Math.max(index, lastCheckboxChecked.current);
        i++
      ) {
        const checkbox = checkboxRefs.current[i];
        if (checkbox) {
          checkbox.checked = true;
        }
      }
    }

    if (current?.checked) {
      lastCheckboxChecked.current = index;
    }

    setShowDeleteButton(anyChecked());

    const allChecked = checkboxRefs.current.every(
      (checkbox) => checkbox?.checked === true,
    );
    if (selectAllRef.current) {
      selectAllRef.current.checked = allChecked;
    }
  }

  function handleCheckboxClick(e: React.MouseEvent, index: number) {
    syncSelection(index, e.shiftKey);
  }

  // Space already toggles a checkbox natively (and fires click), so only Enter needs handling
  function handleCheckboxKeydown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (e.key === "Enter") {
      const checkbox = checkboxRefs.current[index];
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      syncSelection(index, e.shiftKey);
    }
  }

  function handleSelectAll() {
    const checked = selectAllRef.current?.checked === true;
    checkboxRefs.current.forEach((checkbox) => {
      if (checkbox) {
        checkbox.checked = checked;
      }
    });
    setShowDeleteButton(checked);
  }

  function handleSelectAllKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectAllRef.current) {
        selectAllRef.current.checked = !selectAllRef.current.checked;
        handleSelectAll();
      }
    }
  }

  // Opens the dialog box to confirm deleting the selected items
  function confirmDeletion() {
    const count = checkboxRefs.current.filter((cb) => cb?.checked).length;
    const plural = count > 1;
    const all = count === items.length && plural;
    let message = `Are you sure you want to delete `;
    if (all) {
      message += `all of your `;
    } else {
      message += plural ? `these ${count} ` : `this `;
    }
    message += `${itemLabel}${plural ? "s" : ""}? You won't be able to get ${plural ? "them" : "it"} back.`;
    confirmDeleteMessage.current = message;
    setShowConfirmDelete(true);
  }

  // Deletes all selected items
  async function deleteItems() {
    setShowConfirmDelete(false);
    setShowLoading(true);
    const idsToBeDeleted = checkboxRefs.current
      .map((checkbox) =>
        checkbox?.checked === true ? checkbox.dataset.itemId : null,
      )
      .filter((id): id is string => id !== null && id !== undefined);
    const options = {
      method: "DELETE",
      body: JSON.stringify({ items: idsToBeDeleted }),
      headers: { "Content-Type": "application/json" },
    };
    // TODO: replace with your delete endpoint
    const res = await fetch("/api/deleteItems", options);
    const data = await res.json();
    if (data.success) {
      const deleted = new Set(idsToBeDeleted);
      setItems(items.filter((item) => !deleted.has(item.id)));
    } else if (data.logout) {
      router.push("/login");
    }
    setShowLoading(false);
    setShowDeleteButton(false);
    setShowDeleteMenu(false);
  }

  const header = (
    <div
      className={classNames(styles.selection_manager_header, {
        [styles.show_delete_menu]: showDeleteMenu,
      })}
    >
      <h1>
        {headlineIcon}
        {headlineText}
      </h1>
      <div>
        {items.length > 0 && !showDeleteMenu && (
          <div className={styles.trash_btn_wrapper}>
            <Button
              variant="tertiary"
              onClick={openDeleteMenu}
              title="Open Delete Menu"
              width="smallest"
            >
              <TrashIcon />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className={styles.selection_manager}>
        <div className={styles.content_wrapper}>
          {header}
          <div className={styles.message_wrapper}>
            <div className={styles.message} role="status" aria-live="polite">
              {emptyMessage}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.selection_manager}>
      {showConfirmDelete && (
        <Modal
          closeFunction={() => setShowConfirmDelete(false)}
          animate={true}
          unstyled={true}
        >
          <ConfirmationBox
            message={confirmDeleteMessage.current}
            onConfirm={deleteItems}
            onCancel={() => setShowConfirmDelete(false)}
            ariaLabel={`Confirm Deletion Panel`}
          />
        </Modal>
      )}
      {showLoading && (
        <LoaderFullscreen ariaLabel={`Deleting... Please wait.`}>
          <LoaderCircle />
        </LoaderFullscreen>
      )}
      <div className={styles.content_wrapper}>
        {header}
        {showDeleteMenu && (
          <div className={styles.delete_menu}>
            <Button
              variant="tertiary"
              title="Close Delete Menu"
              onClick={closeDeleteMenu}
            >{`Cancel`}</Button>
            {showDeleteButton ? (
              <Button
                variant="primary"
                title="Delete selected items"
                onClick={confirmDeletion}
              >{`Delete`}</Button>
            ) : (
              <Button
                variant="tertiary"
                ariaLabel="Select items to enable this delete button"
                aria-disabled="true"
                disabled={true}
                onClick={() => {}}
              >{`Delete`}</Button>
            )}
          </div>
        )}
        <div className={styles.items_and_select_all_wrapper}>
          {showDeleteMenu && multiSelect && (
            <div className={styles.select_all_wrapper}>
              <input
                type={"checkbox"}
                className={styles.checkbox}
                onClick={handleSelectAll}
                onKeyDown={handleSelectAllKeydown}
                ref={selectAllRef}
                aria-label="Select all items"
              />
              <div>{`Select All`}</div>
            </div>
          )}
          <div className={styles.items_wrapper}>
            {items.map((item, index) => {
              return (
                <div className={styles.item_container} key={item.id}>
                  {showDeleteMenu && (
                    <div className={styles.checkbox_wrapper}>
                      <input
                        type={"checkbox"}
                        className={styles.checkbox}
                        ref={(el) => {
                          checkboxRefs.current[index] = el;
                        }}
                        onClick={(e) => handleCheckboxClick(e, index)}
                        onKeyDown={(e) => handleCheckboxKeydown(e, index)}
                        data-item-id={item.id}
                        aria-label={
                          checkboxRefs.current[index]?.checked
                            ? `Deselect item`
                            : `Select item`
                        }
                      />
                    </div>
                  )}
                  <Item item={item} selecting={showDeleteMenu} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
