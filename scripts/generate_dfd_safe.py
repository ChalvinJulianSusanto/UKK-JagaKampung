
def create_safe_drawio_xml(diagram_name, processes, stores, entities, flows, title_text):
    # Header standard Draw.io
    xml_content = f"""<mxfile host="Electron" agent="Antigravity" version="24.0.0" type="device">
  <diagram id="dfd2-{diagram_name.lower()}" name="DFD Level 2 - {diagram_name}">
    <mxGraphModel dx="1422" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="1500" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
"""

    # 1. Title
    xml_content += f"""        <mxCell id="title" value="{title_text}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=20;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="600" y="50" width="600" height="40" as="geometry" />
        </mxCell>
"""

    # Styles
    style_process = "ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeWidth=2;fontSize=12;"
    style_entity = "rounded=0;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;strokeWidth=2;fontSize=13;fontStyle=1;"
    style_store = "shape=partialRectangle;whiteSpace=wrap;html=1;left=0;right=0;fillColor=#f5f5f5;strokeColor=#666666;fontSize=12;"
    style_flow = "endArrow=classic;html=1;strokeWidth=1.5;"
    
    # Layout Constants
    LEFT_X = 150
    RIGHT_X = 1450
    CENTER_START_X = 500
    CENTER_GAP_X = 350
    ROW_Y_START = 300
    ROW_GAP_Y = 250
    STORE_Y_OFFSET = -120

    # 2. Entities
    for i, entity in enumerate(entities):
        x_pos = LEFT_X if entity['side'] == 'left' else RIGHT_X
        y_pos = ROW_Y_START + (i * 200) % 600
        
        xml_content += f"""        <mxCell id="{entity['id']}" value="{entity['label']}" style="{style_entity}" vertex="1" parent="1">
          <mxGeometry x="{x_pos}" y="{y_pos}" width="140" height="70" as="geometry" />
        </mxCell>
"""

    # 3. Processes & Stores
    for i, proc in enumerate(processes):
        col = i % 3
        row = i // 3
        x_pos = CENTER_START_X + (col * CENTER_GAP_X)
        y_pos = ROW_Y_START + (row * ROW_GAP_Y)
        
        # Process
        xml_content += f"""        <mxCell id="{proc['id']}" value="{proc['label']}" style="{style_process}" vertex="1" parent="1">
          <mxGeometry x="{x_pos}" y="{y_pos}" width="130" height="100" as="geometry" />
        </mxCell>
"""
        # Store (Optional)
        if 'store' in proc:
            store = proc['store']
            store_y = y_pos + STORE_Y_OFFSET
            
            xml_content += f"""        <mxCell id="{store['id']}" value="{store['label']}" style="{style_store}" vertex="1" parent="1">
          <mxGeometry x="{x_pos}" y="{store_y}" width="130" height="40" as="geometry" />
        </mxCell>
"""
            # Store Connections (Dashed)
            xml_content += f"""        <mxCell id="conn_{store['id']}_{proc['id']}" value="" style="{style_flow}dashed=1;" edge="1" parent="1" source="{store['id']}" target="{proc['id']}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="conn_{proc['id']}_{store['id']}" value="" style="{style_flow}dashed=1;" edge="1" parent="1" source="{proc['id']}" target="{store['id']}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
"""

    # 4. Flows
    for flow in flows:
        extra_style = ""
        if flow.get('dashed'): extra_style += "dashed=1;"
        if flow.get('curved'): extra_style += "curved=1;"
        
        xml_content += f"""        <mxCell id="flow_{flow['src']}_{flow['target']}" value="{flow['label']}" style="{style_flow}{extra_style}" edge="1" parent="1" source="{flow['src']}" target="{flow['target']}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
"""

    # Footer
    xml_content += """      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""
    
    return xml_content

# ================= DATA DEFS =================

def generate_schedule():
    entities = [
        {'id': 'admin', 'label': 'Admin', 'side': 'left'},
        {'id': 'user', 'label': 'User/Warga', 'side': 'right'},
        {'id': 'rt', 'label': 'Ketua RT', 'side': 'right'}
    ]
    
    processes = [
        {'id': 'p21', 'label': '2.1 &#xa;Buat Wadah &#xa;Jadwal', 'store': {'id': 'ds2a', 'label': 'D2 | Schedule'}},
        {'id': 'p22', 'label': '2.2 &#xa;Tambah Petugas &#xa;ke Jadwal', 'store': {'id': 'ds1', 'label': 'D1 | User'}},
        {'id': 'p23', 'label': '2.3 &#xa;Validasi &#xa;Data Entry'},
        {'id': 'p24', 'label': '2.4 &#xa;Kirim Notifikasi &#xa;Jadwal', 'store': {'id': 'ds8', 'label': 'D8 | Notification'}},
        {'id': 'p25', 'label': '2.5 &#xa;Update/Hapus &#xa;Jadwal'},
        {'id': 'p26', 'label': '2.6 &#xa;Lihat Partner &#xa;Hari Ini'}
    ]
    
    flows = [
        {'src': 'admin', 'target': 'p21', 'label': 'bulan/tahun'},
        {'src': 'p21', 'target': 'p22', 'label': 'id jadwal'},
        {'src': 'admin', 'target': 'p22', 'label': 'data petugas'},
        {'src': 'p22', 'target': 'p23', 'label': 'cek validasi'},
        {'src': 'p23', 'target': 'p22', 'label': 'valid'},
        {'src': 'p22', 'target': 'p24', 'label': 'trigger notif'},
        {'src': 'p24', 'target': 'user', 'label': 'email info', 'curved': True},
        {'src': 'admin', 'target': 'p25', 'label': 'request edit'},
        {'src': 'user', 'target': 'p26', 'label': 'cek partner'},
        {'src': 'p26', 'target': 'user', 'label': 'list partner'},
        {'src': 'rt', 'target': 'p21', 'label': 'view all'}
    ]
    
    return create_safe_drawio_xml("Jadwal", processes, [], entities, flows, "DFD Level 2 - Proses 2: Manajemen Jadwal")

def generate_activity():
    entities = [
        {'id': 'admin', 'label': 'Admin', 'side': 'left'},
        {'id': 'warga', 'label': 'Warga', 'side': 'right'}
    ]
    
    processes = [
        {'id': 'p41', 'label': '4.1 &#xa;Buat Kegiatan &#xa;Baru', 'store': {'id': 'ds4a', 'label': 'D4 | Activity'}},
        {'id': 'p42', 'label': '4.2 &#xa;Upload Banner &#xa;Kegiatan'},
        {'id': 'p43', 'label': '4.3 &#xa;Upload &#xa;Dokumentasi', 'store': {'id': 'ds4b', 'label': 'D4 | Activity'}},
        {'id': 'p44', 'label': '4.4 &#xa;Tampilkan Feed &#xa;Kegiatan'},
        {'id': 'p45', 'label': '4.5 &#xa;Filter Konten &#xa;Expired'},
        {'id': 'p46', 'label': '4.6 &#xa;Validasi &#xa;Input'}
    ]
    
    flows = [
        {'src': 'admin', 'target': 'p41', 'label': 'input kegiatan'},
        {'src': 'p41', 'target': 'p46', 'label': 'raw data'},
        {'src': 'p46', 'target': 'p41', 'label': 'valid'},
        {'src': 'p41', 'target': 'p42', 'label': 'next step'},
        {'src': 'admin', 'target': 'p42', 'label': 'file foto'},
        {'src': 'admin', 'target': 'p43', 'label': 'file dokumentasi'},
        {'src': 'warga', 'target': 'p44', 'label': 'lihat feed'},
        {'src': 'p44', 'target': 'p45', 'label': 'filter'},
        {'src': 'p45', 'target': 'p44', 'label': 'clean data'},
        {'src': 'p44', 'target': 'warga', 'label': 'list kegiatan'}
    ]
    
    return create_safe_drawio_xml("Kegiatan", processes, [], entities, flows, "DFD Level 2 - Proses 4: Manajemen Kegiatan")

if __name__ == "__main__":
    output_dir = "c:/Users/user/Desktop/JagaKampung/docs"
    
    # Write files
    with open(f"{output_dir}/JagaKampung_DFD_Level2_Jadwal.drawio", "w", encoding='utf-8') as f:
        f.write(generate_schedule())
        
    with open(f"{output_dir}/JagaKampung_DFD_Level2_Kegiatan.drawio", "w", encoding='utf-8') as f:
        f.write(generate_activity())
        
    print("✅ Successfully generated safe XML files.")
