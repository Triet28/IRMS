package com.irms.menu.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemKey implements Serializable {

    @Column(name = "combo_id")
    private Long comboId;

    @Column(name = "item_id")
    private Long itemId;
}
