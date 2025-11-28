from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import numpy as np
import joblib
import plotly
import plotly.express as px
import plotly.graph_objects as go
import json
import os
from datetime import datetime

app = Flask(__name__)

# Cargar modelos entrenados
try:
    scaler = joblib.load('models/scaler.joblib')
    pca = joblib.load('models/pca.joblib')
    kmeans = joblib.load('models/kmeans_model.joblib')
    feature_names = joblib.load('models/feature_names.joblib')
    cluster_names = joblib.load('models/cluster_names.joblib')
    df_clustered = pd.read_csv('data/processed/customers_with_clusters.csv')
    print("✅ Modelos cargados exitosamente")
    
    # Verificar columnas disponibles para debugging
    print("📊 Columnas en el dataset:", df_clustered.columns.tolist())
    
except Exception as e:
    print(f"❌ Error cargando modelos: {e}")
    scaler = pca = kmeans = feature_names = cluster_names = df_clustered = None

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard interactivo"""
    if df_clustered is None:
        return "Error: No se pudieron cargar los datos", 500
    
    # Gráfico 1: Distribución de clusters - RENDERIZADO COMO HTML
    cluster_dist = df_clustered['Cluster_Name'].value_counts().reset_index()
    cluster_dist.columns = ['Cluster', 'Count']
    
    fig1 = px.pie(cluster_dist, values='Count', names='Cluster', 
                  title='Distribución de Segmentos de Clientes')
    # Convertir a HTML en lugar de JSON
    graph1_html = fig1.to_html(full_html=False, include_plotlyjs='cdn')
    
    # Gráfico 2: Scatter plot de clusters - RENDERIZADO COMO HTML
    graph2_html = None
    if 'PC1' in df_clustered.columns and 'PC2' in df_clustered.columns:
        # Seleccionar columnas existentes para hover_data
        available_columns = df_clustered.columns.tolist()
        
        # Buscar columnas comunes para el hover
        hover_columns = []
        potential_hover_cols = ['Age', 'Income Level', 'Premium Amount', 'Coverage Amount', 'Gender', 'Education Level']
        
        for col in potential_hover_cols:
            if col in available_columns:
                hover_columns.append(col)
        
        # Si no encontramos columnas específicas, usar las primeras disponibles
        if not hover_columns and len(available_columns) > 0:
            hover_columns = available_columns[:3]
        
        print(f"🔍 Usando columnas para hover: {hover_columns}")
        
        fig2 = px.scatter(df_clustered, x='PC1', y='PC2', color='Cluster_Name',
                         hover_data=hover_columns,
                         title='Visualización de Segmentos - PCA')
        graph2_html = fig2.to_html(full_html=False, include_plotlyjs=False)
    else:
        print("⚠️ No se encontraron columnas PC1 y PC2 para el gráfico de dispersión")
    
    # Estadísticas básicas
    stats = {
        'total_clientes': len(df_clustered),
        'total_segmentos': len(cluster_names) if cluster_names else 0,
        'segmento_mayor': cluster_dist.iloc[0]['Cluster'] if len(cluster_dist) > 0 else 'N/A',
        'segmento_menor': cluster_dist.iloc[-1]['Cluster'] if len(cluster_dist) > 0 else 'N/A'
    }
    
    return render_template('dashboard.html', 
                         graph1_html=graph1_html,  # Cambiado de graph1 a graph1_html
                         graph2_html=graph2_html,  # Cambiado de graph2 a graph2_html
                         stats=stats,
                         cluster_names=cluster_names,
                         df_clustered=df_clustered)

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Página de predicción de nuevos clientes"""
    if request.method == 'POST':
        try:
            # Obtener datos del formulario
            form_data = {}
            for feature in feature_names:
                if feature in request.form:
                    # Convertir a float si es numérico
                    try:
                        form_data[feature] = float(request.form[feature])
                    except ValueError:
                        return render_template('predict.html', 
                                            error=f"Valor inválido para {feature}",
                                            show_result=True,
                                            feature_names=feature_names)
            
            # Validar que tenemos todos los features necesarios
            missing_features = set(feature_names) - set(form_data.keys())
            if missing_features:
                return render_template('predict.html', 
                                    error=f"Faltan features: {missing_features}",
                                    show_result=True,
                                    feature_names=feature_names)
            
            # Crear DataFrame
            new_customer = pd.DataFrame([form_data])
            
            # Predecir segmento
            scaled_data = scaler.transform(new_customer)
            pca_data = pca.transform(scaled_data)
            cluster_num = kmeans.predict(pca_data)[0]
            cluster_name = cluster_names[cluster_num]
            
            # Información del segmento
            segment_info = get_segment_info(cluster_num)
            
            return render_template('predict.html', 
                                prediction=cluster_name,
                                segment_info=segment_info,
                                show_result=True,
                                feature_names=feature_names)
            
        except Exception as e:
            return render_template('predict.html', 
                                error=f"Error en la predicción: {str(e)}",
                                show_result=True,
                                feature_names=feature_names)
    
    return render_template('predict.html', 
                         show_result=False,
                         feature_names=feature_names)

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API para predicción de segmentos"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        new_customer = pd.DataFrame([data])
        
        # Validar que tenga las features necesarias
        missing_features = set(feature_names) - set(new_customer.columns)
        if missing_features:
            return jsonify({'error': f'Faltan features: {list(missing_features)}'}), 400
        
        # Predecir
        scaled_data = scaler.transform(new_customer[feature_names])
        pca_data = pca.transform(scaled_data)
        cluster_num = kmeans.predict(pca_data)[0]
        
        return jsonify({
            'cluster_number': int(cluster_num),
            'cluster_name': cluster_names[cluster_num],
            'segment_info': get_segment_info(cluster_num)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analysis')
def analysis():
    """Análisis detallado de segmentos"""
    if df_clustered is None:
        return "Error: No se pudieron cargar los datos", 500
    
    # Encontrar columnas numéricas para estadísticas
    numeric_columns = df_clustered.select_dtypes(include=[np.number]).columns.tolist()
    
    # Excluir columnas de PCA y cluster
    exclude_cols = ['PC1', 'PC2', 'PC3', 'Cluster']
    stats_columns = [col for col in numeric_columns if col not in exclude_cols]
    
    # Tomar máximo 4 columnas para el análisis
    stats_columns = stats_columns[:4]
    
    if stats_columns:
        # Estadísticas por segmento
        segment_stats = df_clustered.groupby('Cluster_Name')[stats_columns].agg({
            col: ['mean', 'std', 'count'] for col in stats_columns
        }).round(2)
        
        # Convertir a HTML para mostrar en template
        stats_html = segment_stats.to_html(classes='table table-striped')
    else:
        stats_html = "<p>No hay suficientes columnas numéricas para el análisis.</p>"
    
    return render_template('analysis.html', 
                         stats_html=stats_html,
                         cluster_names=cluster_names,
                         df_clustered=df_clustered)

@app.route('/download/report')
def download_report():
    """Descargar reporte de segmentación"""
    try:
        return send_file('reports/segmentacion_mercado_report.txt', 
                        as_attachment=True,
                        download_name=f'segmentacion_report_{datetime.now().strftime("%Y%m%d")}.txt')
    except Exception as e:
        return f"Error generando reporte: {str(e)}", 500

def get_segment_info(cluster_num):
    """Obtener información detallada de un segmento"""
    segment_data = df_clustered[df_clustered['Cluster'] == cluster_num]
    
    info = {
        'size': len(segment_data),
        'percentage': (len(segment_data) / len(df_clustered)) * 100,
    }
    
    # Agregar estadísticas de columnas comunes si existen
    common_columns = ['Age', 'Income Level', 'Premium Amount', 'Coverage Amount']
    
    for col in common_columns:
        if col in df_clustered.columns:
            info[f'avg_{col.lower().replace(" ", "_")}'] = segment_data[col].mean()
    
    return info

# Función para verificar la estructura de datos
@app.route('/debug')
def debug():
    """Página de debugging para verificar la estructura de datos"""
    if df_clustered is None:
        return "No hay datos cargados"
    
    debug_info = {
        'columnas': df_clustered.columns.tolist(),
        'forma': df_clustered.shape,
        'clusters_unicos': df_clustered['Cluster'].unique().tolist() if 'Cluster' in df_clustered.columns else 'No hay columna Cluster',
        'nombres_clusters': dict(cluster_names) if cluster_names else 'No hay nombres de clusters',
        'features_modelo': feature_names if feature_names else 'No hay features del modelo'
    }
    
    return jsonify(debug_info)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)