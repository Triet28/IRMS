package com.irms.menu.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(schema = "menu_schema", name = "combo_items")
@Getter
@Setter
@NoArgsConstructor
public class ComboItemEntry {

    @EmbeddedId
    private ComboItemKey id = new ComboItemKey();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("comboId")
    @JoinColumn(name = "combo_id")
    private Combo combo;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("itemId")
    @JoinColumn(name = "item_id")
    private MenuItem menuItem;

    @Column(nullable = false)
    private int quantity = 1;
}
