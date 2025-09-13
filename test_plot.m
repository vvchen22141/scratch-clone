x = 0:0.1:2*pi;
y = sin(x);
plot(x, y);
title('Sine Wave');
xlabel('x');
ylabel('sin(x)');
%saveas(gcf, 'sine_wave.png');
waitfor(gcf);

%run with mathlab -batch "test_plot"